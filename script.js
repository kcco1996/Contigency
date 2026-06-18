const navButtons = document.querySelectorAll(".nav-btn");
const views = document.querySelectorAll(".view");

const scenarioForm = document.getElementById("scenarioForm");
const scenarioList = document.getElementById("scenarioList");
const emptyState = document.getElementById("emptyState");

const editingScenarioId = document.getElementById("editingScenarioId");
const formEyebrow = document.getElementById("formEyebrow");
const formTitle = document.getElementById("formTitle");
const saveScenarioBtn = document.getElementById("saveScenarioBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const scenarioSearchInput = document.getElementById("scenarioSearchInput");
const filterButtons = document.querySelectorAll(".filter-pill");

let currentFilter = "All";
let currentSearch = "";

function showView(targetView) {
  views.forEach((view) => {
    view.classList.remove("active-view");
  });

  navButtons.forEach((button) => {
    button.classList.remove("active");
  });

  const selectedView = document.getElementById(targetView);

  if (selectedView) {
    selectedView.classList.add("active-view");
  }

  const matchingNavButton = document.querySelector(
    `.nav-btn[data-view="${targetView}"]`
  );

  if (matchingNavButton) {
    matchingNavButton.classList.add("active");
  }
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-view-link]");

  if (!link) return;

  showView(link.dataset.viewLink);
});

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showView(button.dataset.view);
  });
});

function textToList(text) {
  return text
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

function listToText(items) {
  if (!items || items.length === 0) {
    return "";
  }

  return items.join("\n");
}

function getSavedScenarios() {
  return JSON.parse(localStorage.getItem("contingencyScenarios")) || [];
}

function saveScenarios(scenarios) {
  localStorage.setItem("contingencyScenarios", JSON.stringify(scenarios));
}

function getSeverityClass(severity) {
  return String(severity || "Green").toLowerCase();
}

function createScenarioCard(scenario) {
  return `
    <div class="scenario-card library-card">

      <div class="card-top-row">
        <div>
          <p class="category-label">${scenario.category}</p>
          <h3>${scenario.title}</h3>
        </div>

        <span class="severity ${getSeverityClass(scenario.severity)}">
          ${scenario.severity}
        </span>
      </div>

      <p class="scenario-desc">
        ${scenario.trigger || "No trigger added yet."}
      </p>

      <div class="scenario-meta-row">
        <span>🛡️ ${scenario.preparedness}% ready</span>
        <span>📅 ${scenario.reviewFrequency}</span>
      </div>

      <div class="card-actions">
        <button onclick="openScenario('${scenario.id}')">
          Open Plan
        </button>

        <button class="secondary-btn" onclick="openQuickAction('${scenario.id}')">
          Quick Action
        </button>
      </div>

    </div>
  `;
}

function scenarioMatchesSearch(scenario) {
  const search = currentSearch.toLowerCase();

  if (!search) return true;

  const searchableText = `
    ${scenario.title}
    ${scenario.category}
    ${scenario.severity}
    ${scenario.trigger}
    ${scenario.notes}
    ${scenario.lessons}
    ${(scenario.immediateSteps || []).join(" ")}
    ${(scenario.backupPlan || []).join(" ")}
    ${(scenario.recoveryPlan || []).join(" ")}
    ${(scenario.resources || []).join(" ")}
    ${(scenario.contacts || []).join(" ")}
    ${(scenario.links || []).join(" ")}
  `.toLowerCase();

  return searchableText.includes(search);
}

function scenarioMatchesFilter(scenario) {
  if (currentFilter === "All") return true;
  return scenario.category === currentFilter;
}

function getFilteredScenarios() {
  return getSavedScenarios().filter((scenario) => {
    return scenarioMatchesFilter(scenario) && scenarioMatchesSearch(scenario);
  });
}

function renderScenarios() {
  const filteredScenarios = getFilteredScenarios();

  scenarioList.innerHTML = "";

  if (filteredScenarios.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  filteredScenarios
    .slice()
    .reverse()
    .forEach((scenario) => {
      scenarioList.innerHTML += createScenarioCard(scenario);
    });
}

function updateLibrarySummary() {
  const scenarios = getSavedScenarios();

  const totalPlansCount = document.getElementById("totalPlansCount");
  const redPlansCount = document.getElementById("redPlansCount");
  const amberPlansCount = document.getElementById("amberPlansCount");

  const redPlans = scenarios.filter((scenario) => scenario.severity === "Red");
  const amberPlans = scenarios.filter((scenario) => scenario.severity === "Amber");

  if (totalPlansCount) totalPlansCount.textContent = scenarios.length;
  if (redPlansCount) redPlansCount.textContent = redPlans.length;
  if (amberPlansCount) amberPlansCount.textContent = amberPlans.length;
}

function getAveragePreparednessByCategory(category) {
  const scenarios = getSavedScenarios().filter((scenario) => {
    return scenario.category === category;
  });

  if (scenarios.length === 0) return 0;

  const total = scenarios.reduce((sum, scenario) => {
    return sum + Number(scenario.preparedness || 0);
  }, 0);

  return Math.round(total / scenarios.length);
}

function updateScore(category, textId, barId) {
  const score = getAveragePreparednessByCategory(category);

  const textElement = document.getElementById(textId);
  const barElement = document.getElementById(barId);

  if (textElement) textElement.textContent = `${score}% ready`;
  if (barElement) barElement.style.width = `${score}%`;
}

function updateDashboardScores() {
  updateScore("Travel", "travelScoreText", "travelScoreBar");
  updateScore("Work", "workScoreText", "workScoreBar");
  updateScore("Money", "moneyScoreText", "moneyScoreBar");
  updateScore("Wellbeing", "wellbeingScoreText", "wellbeingScoreBar");

  const scenarios = getSavedScenarios();
  const overallPreparednessLabel = document.getElementById("overallPreparednessLabel");

  if (!overallPreparednessLabel) return;

  if (scenarios.length === 0) {
    overallPreparednessLabel.textContent = "Not Started";
    return;
  }

  const total = scenarios.reduce((sum, scenario) => {
    return sum + Number(scenario.preparedness || 0);
  }, 0);

  const average = Math.round(total / scenarios.length);

  if (average >= 75) {
    overallPreparednessLabel.textContent = "Prepared";
  } else if (average >= 40) {
    overallPreparednessLabel.textContent = "Building";
  } else {
    overallPreparednessLabel.textContent = "Needs Work";
  }
}

function createDashboardPriorityCard(scenario) {
  const firstActions = (scenario.immediateSteps || []).slice(0, 3);

  return `
    <div class="scenario-card priority-card">
      <div class="card-top-row">
        <div>
          <p class="category-label">${scenario.category}</p>
          <h3>${scenario.title}</h3>
        </div>

        <span class="severity ${getSeverityClass(scenario.severity)}">
          ${scenario.severity}
        </span>
      </div>

      <p class="scenario-desc">
        ${scenario.trigger || "No trigger added yet."}
      </p>

      <div class="mini-checklist">
        <p>First actions:</p>
        ${
          firstActions.length > 0
            ? `
              <ul>
                ${firstActions.map((step) => `<li>${step}</li>`).join("")}
              </ul>
            `
            : `
              <ul>
                <li>Pause and stabilise first</li>
                <li>Open the full plan</li>
                <li>Follow the next safe action</li>
              </ul>
            `
        }
      </div>

      <div class="card-actions">
        <button onclick="openScenario('${scenario.id}')">Open Plan</button>
        <button class="secondary-btn" onclick="openQuickAction('${scenario.id}')">
          Quick Action
        </button>
      </div>
    </div>
  `;
}

function renderDashboardPriorityList() {
  const dashboardPriorityList = document.getElementById("dashboardPriorityList");

  if (!dashboardPriorityList) return;

  const scenarios = getSavedScenarios();

  const priorityScenarios = scenarios
    .filter((scenario) => scenario.severity === "Red" || scenario.severity === "Amber")
    .sort((a, b) => {
      const severityRank = { Red: 1, Amber: 2, Green: 3 };
      return severityRank[a.severity] - severityRank[b.severity];
    })
    .slice(0, 2);

  if (priorityScenarios.length === 0) {
    dashboardPriorityList.innerHTML = `
      <div class="reminder-card">
        <h3>No high priority scenarios yet</h3>
        <p>Add Red or Amber scenarios and they will appear here automatically.</p>
      </div>
    `;
    return;
  }

  dashboardPriorityList.innerHTML = priorityScenarios
    .map((scenario) => createDashboardPriorityCard(scenario))
    .join("");
}

function refreshApp() {
  renderScenarios();
  updateLibrarySummary();
  updateDashboardScores();
  renderDashboardPriorityList();
}

function listToChecklist(items) {
  if (!items || items.length === 0) {
    return `<p>No items added yet.</p>`;
  }

  return `
    <div class="detail-list">
      ${items
        .map(
          (item) => `
            <label>
              <input type="checkbox" />
              <span>${item}</span>
            </label>
          `
        )
        .join("")}
    </div>
  `;
}

function linksToList(links) {
  if (!links || links.length === 0) {
    return `<p>No links added yet.</p>`;
  }

  return `
    <div class="detail-list link-list">
      ${links
        .map(
          (link) => `
            <label>
              🔗
              <a href="${link}" target="_blank">${link}</a>
            </label>
          `
        )
        .join("")}
    </div>
  `;
}

function openScenario(id) {
  const scenarios = getSavedScenarios();
  const scenario = scenarios.find((item) => item.id === id);

  if (!scenario) return;

  document.getElementById("detailTitle").textContent = scenario.title;

  const detailContent = document.getElementById("scenarioDetailContent");

  detailContent.innerHTML = `
    <div class="detail-card detail-header-card">
      <div class="card-top-row">
        <div>
          <p class="category-label">${scenario.category}</p>
          <h3>${scenario.title}</h3>
        </div>

        <span class="severity ${getSeverityClass(scenario.severity)}">
          ${scenario.severity}
        </span>
      </div>

      <p>${scenario.trigger || "No trigger added yet."}</p>

      <div class="detail-meta-row">
        <span>🛡️ ${scenario.preparedness}% ready</span>
        <span>📅 ${scenario.reviewFrequency}</span>
      </div>
    </div>

    <div class="detail-card">
      <h3>Immediate Response</h3>
      ${listToChecklist(scenario.immediateSteps)}
    </div>

    <div class="detail-card">
      <h3>Backup Plan</h3>
      ${listToChecklist(scenario.backupPlan)}
    </div>

    <div class="detail-card">
      <h3>Recovery Plan</h3>
      ${listToChecklist(scenario.recoveryPlan)}
    </div>

    <div class="detail-card">
      <h3>Resources Needed</h3>
      ${listToChecklist(scenario.resources)}
    </div>

    <div class="detail-card">
      <h3>Contacts</h3>
      ${listToChecklist(scenario.contacts)}
    </div>

    <div class="detail-card">
      <h3>Useful Links</h3>
      ${linksToList(scenario.links)}
    </div>

    <div class="detail-card">
      <h3>Notes</h3>
      <p>${scenario.notes || "No notes added yet."}</p>
    </div>

    <div class="detail-card">
      <h3>Lessons Learned</h3>
      <p>${scenario.lessons || "No lessons learned added yet."}</p>
    </div>

    <div class="detail-actions three-actions">
      <button class="main-action" onclick="openQuickAction('${scenario.id}')">
        Quick Action
      </button>

      <button class="edit-action" onclick="editScenario('${scenario.id}')">
        Edit
      </button>

      <button class="danger-action" onclick="deleteScenario('${scenario.id}')">
        Delete
      </button>
    </div>
  `;

  showView("scenarioDetailView");
}

function buildScenarioFromForm(existingId = null) {
  return {
    id: existingId || Date.now().toString(),

    title: document.getElementById("scenarioTitle").value.trim(),

    category: document.getElementById("scenarioCategory").value,

    severity: document.getElementById("scenarioSeverity").value,

    preparedness: Math.min(
      100,
      Math.max(0, Number(document.getElementById("scenarioPreparedness").value) || 0)
    ),

    trigger: document.getElementById("scenarioTrigger").value.trim(),

    immediateSteps: textToList(
      document.getElementById("scenarioImmediate").value
    ),

    backupPlan: textToList(
      document.getElementById("scenarioBackup").value
    ),

    recoveryPlan: textToList(
      document.getElementById("scenarioRecovery").value
    ),

    resources: textToList(
      document.getElementById("scenarioResources").value
    ),

    contacts: textToList(
      document.getElementById("scenarioContacts").value
    ),

    links: textToList(
      document.getElementById("scenarioLinks").value
    ),

    notes: document.getElementById("scenarioNotes").value.trim(),

    lessons: document.getElementById("scenarioLessons").value.trim(),

    reviewFrequency: document.getElementById("scenarioReview").value,

    updatedAt: new Date().toISOString()
  };
}

function resetScenarioForm() {
  scenarioForm.reset();
  editingScenarioId.value = "";

  formEyebrow.textContent = "Create Plan";
  formTitle.textContent = "Add new scenario";
  saveScenarioBtn.textContent = "Save Scenario";
  cancelEditBtn.classList.add("hidden");
}

function goToScenarioLibrary() {
  showView("scenariosView");
}

function editScenario(id) {
  const scenarios = getSavedScenarios();
  const scenario = scenarios.find((item) => item.id === id);

  if (!scenario) return;

  editingScenarioId.value = scenario.id;

  document.getElementById("scenarioTitle").value = scenario.title || "";
  document.getElementById("scenarioCategory").value =
    scenario.category || "Travel";
  document.getElementById("scenarioSeverity").value =
    scenario.severity || "Green";
  document.getElementById("scenarioPreparedness").value =
    scenario.preparedness || "";
  document.getElementById("scenarioTrigger").value = scenario.trigger || "";

  document.getElementById("scenarioImmediate").value =
    listToText(scenario.immediateSteps);

  document.getElementById("scenarioBackup").value =
    listToText(scenario.backupPlan);

  document.getElementById("scenarioRecovery").value =
    listToText(scenario.recoveryPlan);

  document.getElementById("scenarioResources").value =
    listToText(scenario.resources);

  document.getElementById("scenarioContacts").value =
    listToText(scenario.contacts);

  document.getElementById("scenarioLinks").value =
    listToText(scenario.links);

  document.getElementById("scenarioNotes").value = scenario.notes || "";
  document.getElementById("scenarioLessons").value = scenario.lessons || "";
  document.getElementById("scenarioReview").value =
    scenario.reviewFrequency || "Monthly";

  formEyebrow.textContent = "Edit Plan";
  formTitle.textContent = "Edit scenario";
  saveScenarioBtn.textContent = "Save Changes";
  cancelEditBtn.classList.remove("hidden");

  showView("addView");
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", () => {
    resetScenarioForm();
    goToScenarioLibrary();
  });
}

if (scenarioForm) {
  scenarioForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const currentEditId = editingScenarioId.value;
    const scenarios = getSavedScenarios();

    if (currentEditId) {
      const updatedScenarios = scenarios.map((scenario) => {
        if (scenario.id === currentEditId) {
          const updatedScenario = buildScenarioFromForm(currentEditId);

          return {
            ...scenario,
            ...updatedScenario,
            createdAt: scenario.createdAt || scenario.updatedAt
          };
        }

        return scenario;
      });

      saveScenarios(updatedScenarios);
      refreshApp();
      resetScenarioForm();

      alert("Scenario updated successfully.");
      goToScenarioLibrary();
      return;
    }

    const newScenario = {
      ...buildScenarioFromForm(),
      createdAt: new Date().toISOString()
    };

    scenarios.push(newScenario);

    saveScenarios(scenarios);
    refreshApp();
    resetScenarioForm();

    alert("Scenario saved successfully.");
    goToScenarioLibrary();
  });
}

function deleteScenario(id) {
  const confirmDelete = confirm(
    "Are you sure you want to delete this scenario? This cannot be undone."
  );

  if (!confirmDelete) return;

  const scenarios = getSavedScenarios();

  const updatedScenarios = scenarios.filter((scenario) => {
    return scenario.id !== id;
  });

  saveScenarios(updatedScenarios);
  refreshApp();

  alert("Scenario deleted.");

  goToScenarioLibrary();
}

function getTopQuickSteps(scenario) {
  const combinedSteps = [
    ...(scenario.immediateSteps || []),
    ...(scenario.backupPlan || [])
  ];

  return combinedSteps.slice(0, 5);
}

function openQuickAction(id) {
  const scenarios = getSavedScenarios();
  const scenario = scenarios.find((item) => item.id === id);

  if (!scenario) return;

  const quickSteps = getTopQuickSteps(scenario);

  document.getElementById("quickTitle").textContent = scenario.title;

  const quickActionContent = document.getElementById("quickActionContent");

  quickActionContent.innerHTML = `
    <div class="quick-action-card">
      <div class="quick-action-header">
        <div>
          <p class="category-label">${scenario.category}</p>
          <h3>${scenario.title}</h3>
          <p>${scenario.trigger || "Focus on the next safe action."}</p>
        </div>

        <span class="severity ${getSeverityClass(scenario.severity)}">
          ${scenario.severity}
        </span>
      </div>

      <div class="quick-step-list">
        ${
          quickSteps.length > 0
            ? quickSteps
                .map(
                  (step) => `
                    <div class="quick-step">
                      <div>
                        <strong>Next action</strong>
                        <span>${step}</span>
                      </div>
                    </div>
                  `
                )
                .join("")
            : `
              <div class="quick-step">
                <div>
                  <strong>Stabilise first</strong>
                  <span>Pause, get somewhere safe, and decide the next smallest action.</span>
                </div>
              </div>
            `
        }
      </div>
    </div>

    <div class="quick-calm-card">
      <h3>Calm reminder</h3>
      <p>
        You do not need to solve everything at once.
        Follow one step, then reassess.
      </p>
    </div>

    <div class="quick-action-buttons">
      <button class="main-action" onclick="openScenario('${scenario.id}')">
        Open Full Plan
      </button>

      <button class="recovery-action" data-view-link="recoveryView">
        Open Recovery Mode
      </button>

      <button class="secondary-action" onclick="goToScenarioLibrary()">
        Return to Library
      </button>
    </div>
  `;

  showView("quickActionView");
}

function openHighestPriorityScenarioByCategory(category) {
  const scenarios = getSavedScenarios().filter((scenario) => {
    return scenario.category === category;
  });

  if (scenarios.length === 0) {
    currentFilter = category;
    currentSearch = "";

    if (scenarioSearchInput) {
      scenarioSearchInput.value = "";
    }

    filterButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.filter === category);
    });

    refreshApp();
    showView("scenariosView");
    alert(`No ${category} scenarios yet. Add one from the Add screen.`);
    return;
  }

  const severityRank = { Red: 1, Amber: 2, Green: 3 };

  const highestPriority = scenarios.sort((a, b) => {
    return severityRank[a.severity] - severityRank[b.severity];
  })[0];

  openQuickAction(highestPriority.id);
}

const emergencyModeBtn = document.getElementById("emergencyModeBtn");

if (emergencyModeBtn) {
  emergencyModeBtn.addEventListener("click", () => {
    const scenarios = getSavedScenarios();

    const redScenarios = scenarios.filter((scenario) => {
      return scenario.severity === "Red";
    });

    if (redScenarios.length === 0) {
      showView("recoveryView");
      alert("No Red emergency scenarios found. Recovery Mode has opened instead.");
      return;
    }

    const highestPriority = redScenarios[0];
    openQuickAction(highestPriority.id);
  });
}

document.querySelectorAll("[data-quick-category]").forEach((button) => {
  button.addEventListener("click", () => {
    openHighestPriorityScenarioByCategory(button.dataset.quickCategory);
  });
});

if (scenarioSearchInput) {
  scenarioSearchInput.addEventListener("input", () => {
    currentSearch = scenarioSearchInput.value.trim();
    renderScenarios();
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    filterButtons.forEach((item) => {
      item.classList.remove("active");
    });

    button.classList.add("active");

    renderScenarios();
  });
});

refreshApp();