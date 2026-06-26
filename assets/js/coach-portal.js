/**
 * Coach portal — sign-in, invite-based activation, photo upload, team admin.
 * Requires Firestore coachRoles + coachInvites and Storage rules (see firebase/).
 */
(function () {
  var fb = window.IGTC_FB;
  if (!fb || typeof firebase === "undefined") return;

  var auth = fb.auth;
  var db = fb.db;
  var storage = fb.storage;

  var ROLES = "coachRoles";
  var INVITES = "coachInvites";

  var authPanel = document.getElementById("auth-panel");
  var unauthorizedPanel = document.getElementById("unauthorized-panel");
  var dashboardPanel = document.getElementById("dashboard-panel");
  var signedInLabel = document.getElementById("signed-in-label");
  var teamTab = document.getElementById("team-tab");

  function $(id) { return document.getElementById(id); }

  function emailKey(email) {
    return email.trim().toLowerCase().replace(/@/g, "_at_").replace(/\./g, "_dot_");
  }

  function showStatus(el, message, kind) {
    if (!el) return;
    el.textContent = message || "";
    el.className = "status" + (kind ? " " + kind : "");
    el.hidden = !message;
  }

  function friendlyAuthError(err) {
    var code = err && err.code ? err.code : "";
    if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
      return "Email or password is incorrect. Try again or use Forgot password.";
    }
    if (code === "auth/email-already-in-use") {
      return "That email already has an account. Use Sign in instead.";
    }
    if (code === "auth/weak-password") {
      return "Choose a stronger password (at least 8 characters).";
    }
    if (code === "auth/too-many-requests") {
      return "Too many attempts. Wait a few minutes and try again.";
    }
    return (err && err.message) || "Something went wrong. Please try again.";
  }

  function setPanel(panel) {
    [authPanel, unauthorizedPanel, dashboardPanel].forEach(function (el) {
      if (el) el.classList.add("hidden");
    });
    if (panel) panel.classList.remove("hidden");
  }

  function switchAuthTab(tab) {
    document.querySelectorAll("[data-auth-tab]").forEach(function (btn) {
      var active = btn.getAttribute("data-auth-tab") === tab;
      btn.classList.toggle("portal-tab--active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelectorAll("[data-auth-panel]").forEach(function (pane) {
      pane.classList.toggle("hidden", pane.getAttribute("data-auth-panel") !== tab);
    });
  }

  function switchDashTab(tab) {
    document.querySelectorAll("[data-dash-tab]").forEach(function (btn) {
      var active = btn.getAttribute("data-dash-tab") === tab;
      btn.classList.toggle("portal-tab--active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelectorAll("[data-dash-panel]").forEach(function (pane) {
      pane.classList.toggle("hidden", pane.getAttribute("data-dash-panel") !== tab);
    });
  }

  async function loadProfile(uid) {
    var snap = await db.collection(ROLES).doc(uid).get();
    return snap.exists ? snap.data() : null;
  }

  async function loadInvite(email) {
    var snap = await db.collection(INVITES).doc(emailKey(email)).get();
    if (!snap.exists || snap.data().status !== "pending") return null;
    return snap.data();
  }

  async function acceptInvite(user, invite, displayName) {
    var batch = db.batch();
    var roleRef = db.collection(ROLES).doc(user.uid);
    batch.set(roleRef, {
      email: user.email.toLowerCase(),
      displayName: displayName || invite.displayName || user.email,
      role: invite.role || "coach",
      status: "active",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      invitedBy: invite.invitedBy || null,
    });
    batch.update(db.collection(INVITES).doc(emailKey(user.email)), {
      status: "accepted",
      acceptedAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid: user.uid,
    });
    await batch.commit();
  }

  async function renderTeamList() {
    var listEl = $("coach-list");
    if (!listEl) return;
    listEl.innerHTML = "<p class=\"muted\">Loading team…</p>";
    try {
      var snap = await db.collection(ROLES).orderBy("displayName").get();
      if (snap.empty) {
        listEl.innerHTML = "<p class=\"muted\">No coaches registered yet.</p>";
        return;
      }
      listEl.innerHTML = "";
      snap.forEach(function (doc) {
        var d = doc.data();
        var row = document.createElement("div");
        row.className = "coach-row";
        var role = d.role === "admin" ? "Head coach (admin)" : "Coach";
        var status = d.status === "active" ? "" : " · disabled";
        row.innerHTML =
          "<div><strong>" + (d.displayName || d.email) + "</strong><br>" +
          "<span class=\"muted\">" + d.email + " · " + role + status + "</span></div>";
        listEl.appendChild(row);
      });
      var invites = await db.collection(INVITES).where("status", "==", "pending").get();
      invites.forEach(function (doc) {
        var d = doc.data();
        var row = document.createElement("div");
        row.className = "coach-row coach-row--pending";
        row.innerHTML =
          "<div><strong>" + (d.displayName || d.email) + "</strong><br>" +
          "<span class=\"muted\">Invite pending · " + d.email + "</span></div>";
        listEl.appendChild(row);
      });
    } catch (e) {
      listEl.innerHTML = "<p class=\"status error\">Could not load team: " + e.message + "</p>";
    }
  }

  function showDashboard(user, profile) {
    setPanel(dashboardPanel);
    if (signedInLabel) {
      signedInLabel.textContent = (profile.displayName || user.email) +
        (profile.role === "admin" ? " · Head coach" : " · Coach");
    }
    if (teamTab) {
      teamTab.classList.toggle("hidden", profile.role !== "admin");
    }
    if (profile.role === "admin") renderTeamList();
    switchDashTab("upload");
  }

  auth.onAuthStateChanged(async function (user) {
    if (!user) {
      setPanel(authPanel);
      switchAuthTab("sign-in");
      return;
    }
    try {
      var profile = await loadProfile(user.uid);
      if (!profile || profile.status !== "active") {
        setPanel(unauthorizedPanel);
        if ($("unauthorized-email")) $("unauthorized-email").textContent = user.email;
        return;
      }
      showDashboard(user, profile);
    } catch (e) {
      setPanel(authPanel);
      showStatus($("login-status"), "Could not verify access: " + e.message, "error");
    }
  });

  document.querySelectorAll("[data-auth-tab]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      switchAuthTab(btn.getAttribute("data-auth-tab"));
    });
  });

  document.querySelectorAll("[data-dash-tab]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      switchDashTab(btn.getAttribute("data-dash-tab"));
      if (btn.getAttribute("data-dash-tab") === "team") renderTeamList();
    });
  });

  $("login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    showStatus($("login-status"), "", "");
    auth.signInWithEmailAndPassword(
      $("login-email").value.trim(),
      $("login-password").value
    ).catch(function (err) {
      showStatus($("login-status"), friendlyAuthError(err), "error");
    });
  });

  $("activate-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    var email = $("activate-email").value.trim().toLowerCase();
    var name = $("activate-name").value.trim();
    var pass = $("activate-password").value;
    var pass2 = $("activate-password2").value;
    showStatus($("activate-status"), "", "");

    if (pass !== pass2) {
      showStatus($("activate-status"), "Passwords do not match.", "error");
      return;
    }
    if (pass.length < 8) {
      showStatus($("activate-status"), "Password must be at least 8 characters.", "error");
      return;
    }

    try {
      var invite = await loadInvite(email);
      if (!invite) {
        showStatus($("activate-status"),
          "No active invite for this email. Ask the head coach to invite you first.", "error");
        return;
      }
      var cred = await auth.createUserWithEmailAndPassword(email, pass);
      await acceptInvite(cred.user, invite, name);
      showStatus($("activate-status"), "Account activated — loading portal…", "success");
    } catch (err) {
      showStatus($("activate-status"), friendlyAuthError(err), "error");
    }
  });

  $("forgot-password-link").addEventListener("click", function (e) {
    e.preventDefault();
    switchAuthTab("reset");
    var email = $("login-email").value.trim();
    if (email) $("reset-email").value = email;
  });

  $("reset-form").addEventListener("submit", function (e) {
    e.preventDefault();
    showStatus($("reset-status"), "", "");
    auth.sendPasswordResetEmail($("reset-email").value.trim())
      .then(function () {
        showStatus($("reset-status"), "Reset link sent — check your inbox.", "success");
      })
      .catch(function (err) {
        showStatus($("reset-status"), friendlyAuthError(err), "error");
      });
  });

  $("logout-btn").addEventListener("click", function () { auth.signOut(); });
  $("unauthorized-logout").addEventListener("click", function () { auth.signOut(); });

  $("invite-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    var user = auth.currentUser;
    if (!user) return;
    var profile = await loadProfile(user.uid);
    if (!profile || profile.role !== "admin") {
      showStatus($("invite-status"), "Only head coaches can invite users.", "error");
      return;
    }

    var email = $("invite-email").value.trim().toLowerCase();
    var displayName = $("invite-name").value.trim();
    var role = $("invite-role").value;
    showStatus($("invite-status"), "", "");

    try {
      var existing = await db.collection(ROLES).where("email", "==", email).where("status", "==", "active").get();
      if (!existing.empty) {
        showStatus($("invite-status"), "That coach already has an active account.", "error");
        return;
      }
      await db.collection(INVITES).doc(emailKey(email)).set({
        email: email,
        displayName: displayName || email,
        role: role,
        status: "pending",
        invitedAt: firebase.firestore.FieldValue.serverTimestamp(),
        invitedBy: user.uid,
      });
      showStatus($("invite-status"),
        "Invite saved. Tell " + email + " to open this page, choose Activate account, and set a password.", "success");
      $("invite-form").reset();
      renderTeamList();
    } catch (err) {
      showStatus($("invite-status"), err.message, "error");
    }
  });

  $("photo-file").addEventListener("change", function (e) {
    var file = e.target.files[0];
    var preview = $("image-preview");
    if (!file || !preview) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      preview.src = ev.target.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(file);
  });

  $("upload-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var file = $("photo-file").files[0];
    var caption = $("photo-caption").value.trim();
    if (!file) return;

    var uploadBtn = $("upload-btn");
    var progressContainer = $("upload-progress-container");
    var progressBar = $("upload-progress");
    var progressPercent = $("progress-percent");

    uploadBtn.disabled = true;
    progressContainer.classList.remove("hidden");
    showStatus($("upload-status"), "", "");

    var user = auth.currentUser;
    var filename = Date.now() + "_" + file.name.replace(/[^\w.\-]+/g, "_");
    var storageRef = storage.ref("photos/" + filename);
    var uploadTask = storageRef.put(file);

    uploadTask.on("state_changed",
      function (snapshot) {
        var pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        progressBar.value = pct;
        progressPercent.textContent = Math.round(pct) + "%";
      },
      function (error) {
        uploadBtn.disabled = false;
        showStatus($("upload-status"), "Upload failed: " + error.message, "error");
      },
      function () {
        uploadTask.snapshot.ref.getDownloadURL().then(function (url) {
          return db.collection("photos").add({
            url: url,
            caption: caption,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            filename: filename,
            uploadedBy: user ? user.uid : null,
          });
        }).then(function () {
          uploadBtn.disabled = false;
          progressContainer.classList.add("hidden");
          showStatus($("upload-status"), "Photo uploaded — it will appear at the top of the gallery.", "success");
          $("upload-form").reset();
          $("image-preview").style.display = "none";
        }).catch(function (err) {
          uploadBtn.disabled = false;
          showStatus($("upload-status"), "Failed to save: " + err.message, "error");
        });
      }
    );
  });
})();
