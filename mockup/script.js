function toast(message) {
  const t = document.getElementById("toast");
  t.textContent = message;
  t.hidden = false;
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => (t.hidden = true), 4500);
}
const actions = [
  {
    id: 0,
    kind: "environment",
    label: "Environnement",
    title: "Au jardin, on sème ensemble",
    short: "On jardine ensemble ?",
    date: "Sam. 12 sept. · 10h – 12h",
    distance: 350,
    place: "Jardin partagé des voisins",
    org: "Les mains vertes de Saint-Cyp’",
    people: 8,
    spots: 4,
    weekend: true,
    description:
      "On prépare les plantations de saison et on partage un café. Venez comme vous êtes : les outils sont sur place.",
    icon: "leaf",
  },
  {
    id: 1,
    kind: "social",
    label: "Entraide",
    title: "Un café, un coup de main",
    short: "Un café entre voisins",
    date: "Dim. 13 sept. · 14h – 16h",
    distance: 600,
    place: "Maison de quartier Saint-Cyprien",
    org: "Le collectif des voisins",
    people: 6,
    spots: 6,
    weekend: true,
    description:
      "Un après-midi pour se rencontrer, échanger des savoir-faire et donner un coup de main sur les petits projets du quartier.",
    icon: "heart",
  },
  {
    id: 2,
    kind: "cultural",
    label: "Culture & partage",
    title: "Des livres en balade",
    short: "Des livres à partager",
    date: "Mer. 16 sept. · 16h – 18h",
    distance: 450,
    place: "Prairie des Filtres",
    org: "Les lecteurs du coin",
    people: 5,
    spots: 8,
    weekend: false,
    description:
      "Apportez un livre que vous avez aimé et repartez avec une nouvelle histoire. Un moment ouvert à toutes les générations.",
    icon: "sun",
  },
];
let category = "all",
  selected = 0,
  activeAction = 0;
const joined = new Set();
function renderActions() {
  const visible = actions.filter(
    (a) =>
      (category === "all" || a.kind === category) &&
      a.distance <= +document.getElementById("distance-filter").value &&
      (document.getElementById("date-filter").value === "all" || a.weekend),
  );
  if (!visible.some((a) => a.id === selected)) selected = visible[0]?.id ?? -1;
  document.getElementById("list-count").textContent = visible.length;
  document.getElementById("map-count").textContent =
    visible.length +
    " initiative" +
    (visible.length === 1 ? "" : "s") +
    " à proximité";
  document.getElementById("action-list").innerHTML = visible.length
    ? visible
        .map(
          (a) =>
            `<button class="action-card ${a.id === selected ? "selected" : ""}" style="margin-bottom:11px" data-card="${a.id}" aria-label="Voir ${a.title}"><div class="card-top"><span class="tag ${a.kind}">${a.label}</span><span class="distance">${a.distance} m · ${Math.round(a.distance / 75)} min</span></div><h3>${a.title}</h3><p>${a.date}</p><p>${a.place}</p><div class="card-bottom"><span style="display:flex;align-items:center;gap:6px"><span class="people"><span>A</span><span>M</span><span>L</span></span>${a.people} voisins</span><span class="spots">${joined.has(a.id) ? "Participation confirmée" : a.spots + " places libres"}</span></div></button>`,
        )
        .join("")
    : '<div class="panel"><h3>Aucune initiative ici</h3><p>Essayez une autre catégorie ou élargissez la distance.</p></div>';
  document.querySelectorAll(".pin").forEach((p) => {
    p.hidden = !visible.some((a) => a.id === +p.dataset.action);
    p.classList.toggle("selected", +p.dataset.action === selected);
  });
  const c = document.getElementById("map-callout");
  c.hidden = selected < 0;
  if (selected >= 0) {
    const a = actions[selected],
      p = document.querySelector(`[data-action="${selected}"]`);
    c.innerHTML = `<strong>${a.short}</strong><small>${a.date.split(" · ")[0]} · à ${a.distance} m</small>`;
    c.style.left =
      selected === 1
        ? `calc(${p.style.left} - 185px)`
        : `calc(${p.style.left} + 37px)`;
    c.style.top = `calc(${p.style.top} - 12px)`;
  }
}
function openAction(id) {
  selected = id;
  activeAction = id;
  renderActions();
  const a = actions[id];
  document.getElementById("action-detail").innerHTML =
    `<span class="tag ${a.kind}">${a.label}</span><h2>${a.title}</h2><p><strong>${a.date}</strong><br>${a.place} · ${a.distance} m</p><p>${a.description}</p><p>Proposé par ${a.org}</p><p>${a.people} voisins inscrits · ${a.spots} places disponibles</p>`;
  const b = document.getElementById("join-action");
  b.textContent = joined.has(id) ? "Participation confirmée" : "Je participe";
  b.disabled = joined.has(id);
  document.getElementById("action-dialog").showModal();
}
document.querySelectorAll("[data-filter]").forEach((b) =>
  b.addEventListener("click", () => {
    category = b.dataset.filter;
    document
      .querySelectorAll("[data-filter]")
      .forEach((x) => x.setAttribute("aria-pressed", x === b));
    renderActions();
  }),
);
document
  .querySelectorAll("#date-filter,#distance-filter")
  .forEach((s) => s.addEventListener("change", renderActions));
document
  .querySelectorAll(".pin")
  .forEach((p) =>
    p.addEventListener("click", () => openAction(+p.dataset.action)),
  );
document.getElementById("action-list").addEventListener("click", (e) => {
  const b = e.target.closest("[data-card]");
  if (b) openAction(+b.dataset.card);
});
document.getElementById("recenter").addEventListener("click", () => {
  selected = 0;
  renderActions();
  toast("Carte recentrée sur la position de démonstration à Saint-Cyprien.");
});
document.getElementById("join-action").addEventListener("click", () => {
  joined.add(activeAction);
  document.getElementById("action-dialog").close();
  renderActions();
  toast("Participation simulée. Aucune inscription réelle n’a été envoyée.");
});
document
  .querySelectorAll(".dialog-close")
  .forEach((b) =>
    b.addEventListener("click", () => b.closest("dialog").close()),
  );
function route() {
  let name = location.hash.slice(1) || "home";
  if (!["home", "login", "signup", "profile", "kit"].includes(name))
    name = "home";
  document
    .querySelectorAll(".page")
    .forEach(
      (p) =>
        (p.hidden =
          p.id !== (["login", "signup"].includes(name) ? "auth-page" : name)),
    );
  if (["login", "signup"].includes(name)) {
    document.getElementById("login").hidden = name !== "login";
    document.getElementById("signup").hidden = name !== "signup";
  }
  document
    .querySelectorAll(".mainnav a")
    .forEach((a) => a.classList.toggle("active", a.dataset.route === name));
  document.querySelectorAll(".demo-links a").forEach((a) => {
    if (a.hash === "#" + name) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  document.title =
    "Pioupiounades · " +
    {
      home: "Mon quartier",
      login: "Connexion",
      signup: "Inscription",
      profile: "Mon profil",
      kit: "Fiche UI",
    }[name];
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);
function profileTab(name) {
  document.querySelectorAll("[data-tab]").forEach((b) => {
    b.setAttribute("aria-selected", b.dataset.tab === name);
    b.tabIndex = b.dataset.tab === name ? 0 : -1;
  });
  document
    .getElementById("profile-activities")
    .setAttribute("aria-labelledby", "tab-" + name);
  document.getElementById("profile-activities").innerHTML = (
    name === "upcoming"
      ? [
          [
            "12",
            "SEPT.",
            "Au jardin, on sème ensemble",
            "10h – 12h · Jardin partagé des voisins",
            "Inscrite",
          ],
          [
            "16",
            "SEPT.",
            "Des livres en balade",
            "16h – 18h · Prairie des Filtres",
            "Inscrite",
          ],
        ]
      : [
          [
            "29",
            "AOÛT",
            "Un quartier tout propre",
            "Collecte citoyenne · 2 heures ensemble",
            "Terminée",
          ],
          [
            "22",
            "AOÛT",
            "Le goûter des voisins",
            "Maison de quartier · 14 voisins",
            "Terminée",
          ],
        ]
  )
    .map(
      (x) =>
        `<div class="engagement"><div class="datebox"><small>${x[1]}</small><strong>${x[0]}</strong></div><div><h3>${x[2]}</h3><p>${x[3]}</p></div><span class="tag">${x[4]}</span></div>`,
    )
    .join("");
}
document.querySelectorAll("[data-tab]").forEach((b) => {
  b.addEventListener("click", () => profileTab(b.dataset.tab));
  b.addEventListener("keydown", (e) => {
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      const next =
        e.key === "Home"
          ? "upcoming"
          : e.key === "End"
            ? "past"
            : b.dataset.tab === "upcoming"
              ? "past"
              : "upcoming";
      profileTab(next);
      document.querySelector(`[data-tab="${next}"]`).focus();
    }
  });
});
document
  .getElementById("edit-profile")
  .addEventListener("click", () =>
    document.getElementById("edit-dialog").showModal(),
  );
document.getElementById("edit-form").addEventListener("submit", (e) => {
  e.preventDefault();
  document.getElementById("profile-display-name").textContent =
    document.getElementById("edit-name").value;
  document.getElementById("profile-bio").textContent =
    document.getElementById("edit-bio").value;
  document.getElementById("visibility-label").textContent =
    document.getElementById("edit-visibility").value;
  document.getElementById("edit-dialog").close();
  toast("Profil mis à jour pour cette démonstration.");
});
document
  .querySelectorAll(".quick button")
  .forEach((b) =>
    b.addEventListener("click", () =>
      toast(
        "Connexion externe présentée à titre de maquette. Utilisez les champs ci-dessous.",
      ),
    ),
  );
renderActions();
profileTab("upcoming");
route();

(function () {
  /* ---------- bascule connexion / inscription ---------- */
  var views = {
    login: document.getElementById("login"),
    signup: document.getElementById("signup"),
  };
  function show(name) {
    location.hash = name;
    document
      .querySelectorAll(".page")
      .forEach((p) => (p.hidden = p.id !== "auth-page"));
    Object.keys(views).forEach(function (k) {
      views[k].hidden = k !== name;
    });
    var h = views[name].querySelector("h1");
    window.scrollTo(0, 0);
    h.setAttribute("tabindex", "-1");
    h.focus({ preventScroll: true });
  }
  document.addEventListener("click", function (e) {
    var sw = e.target.closest("a[data-auth]");
    if (sw) {
      e.preventDefault();
      show(sw.dataset.auth);
      return;
    }
    var dead = e.target.closest('a[href="#"]');
    if (dead) {
      e.preventDefault();
      toast(
        "Écran de démonstration : ce parcours sera disponible dans l’application.",
      );
    }
  });

  /* ---------- afficher / masquer le mot de passe ---------- */
  document.querySelectorAll(".field__toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var input = document.getElementById(btn.getAttribute("aria-controls"));
      var shown = input.type === "text";
      input.type = shown ? "password" : "text";
      btn.textContent = shown ? "Afficher" : "Masquer";
      btn.setAttribute("aria-pressed", String(!shown));
      input.focus();
    });
  });

  /* ---------- validation front : dit ce qui ne va pas, et comment le corriger ----------
     Rappel : ceci est de l'ergonomie. La sécurité, c'est la même validation côté backend. */
  var rules = {
    email: function (v) {
      v = v.trim();
      if (!v) {
        return "Entrez votre adresse e-mail.";
      }
      if (v.indexOf("@") < 0) {
        return "Il manque le @ dans l'adresse.";
      }
      var after = v.split("@")[1];
      if (!after || after.indexOf(".") < 1 || /\.$/.test(after)) {
        return "Il manque la fin de l'adresse, après le @.";
      }
      return "";
    },
    password: function (v) {
      return v ? "" : "Entrez votre mot de passe.";
    },
    newpassword: function (v) {
      if (v.length < 8) {
        return "Au moins 8 caractères — il en manque " + (8 - v.length) + ".";
      }
      if (!/\d/.test(v)) {
        return "Ajoutez au moins un chiffre.";
      }
      return "";
    },
    first: function (v) {
      return v.trim() ? "" : "Vos voisins vous appelleront par votre prénom.";
    },
    last: function (v) {
      return v.trim()
        ? ""
        : "Entrez votre nom — seule l'initiale sera visible.";
    },
    consent: function (v, input) {
      return input.checked ? "" : "Cochez la case pour continuer.";
    },
  };

  function helpOf(input) {
    return document.getElementById(input.getAttribute("aria-describedby"));
  }

  function setState(input, msg) {
    var help = helpOf(input);
    var wrap = input.closest(".field") || input.closest(".consent");
    var isField = wrap.classList.contains("field");
    if (msg) {
      wrap.classList.add(isField ? "field--error" : "consent--error");
      input.setAttribute("aria-invalid", "true");
      help.classList.add("help--error");
      help.innerHTML =
        '<svg class="ic"><use href="#i-alert"/></svg><span></span>';
      help.querySelector("span").textContent = msg;
      help.hidden = false;
    } else {
      wrap.classList.remove("field--error", "consent--error");
      input.removeAttribute("aria-invalid");
      help.classList.remove("help--error");
      if (help.dataset.keep) {
        help.innerHTML = "<span></span>";
        help.querySelector("span").textContent = help.dataset.keep;
        help.hidden = false;
      } else {
        help.hidden = true;
        help.textContent = "";
      }
    }
    return !msg;
  }

  function check(input) {
    return setState(input, rules[input.dataset.check](input.value, input));
  }

  document.querySelectorAll("[data-check]").forEach(function (input) {
    var touched = false;
    input.addEventListener("blur", function () {
      if (input.value || touched) {
        touched = true;
        check(input);
      }
    });
    input.addEventListener("input", function () {
      if (input.getAttribute("aria-invalid")) {
        check(input);
      }
    });
    input.addEventListener("change", function () {
      if (input.type === "checkbox" && input.getAttribute("aria-invalid")) {
        check(input);
      }
    });
  });

  document.querySelectorAll("#auth-page form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      form.querySelectorAll("[data-check]").forEach(function (input) {
        var ok = check(input);
        if (!ok && !firstBad) {
          firstBad = input;
        }
      });
      if (firstBad) {
        firstBad.focus();
        return;
      }
      var btn = form.querySelector(".form__submit"),
        ok = form.querySelector(".form__ok"),
        label = btn.textContent;
      btn.disabled = true;
      btn.textContent =
        form.id === "form-login" ? "Connexion…" : "Création du compte…";
      setTimeout(function () {
        btn.disabled = false;
        btn.textContent = label;
        ok.hidden = false;
        setTimeout(function () {
          ok.hidden = true;
        }, 3000);
      }, 1200);
    });
  });
})();
