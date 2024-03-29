// popup.js

function extractDomain(url) {
	const domainRegex = /^https?:\/\/(www\.)?([^/]+)/;
	const matches = url.match(domainRegex);
	if (matches && matches.length > 2) {
		return matches[2];
	}
	return url;
}

function createWindowWithTabs(tabs) {
	console.log("createWindowWithTabs");
	chrome.windows.create({}, (window) => {
		const windowId = window.id;
		const tabIds = tabs.map((tab) => tab.id);
		chrome.tabs.move(tabIds, { windowId, index: -1 }, () => {
			chrome.tabs.update(windowId, { focused: true });
		});
		console.log("Created window with tabs", window);
	});
}

function groupTabsByDomain(tabs) {
	const tabGroups = {};

	tabs.forEach((tab) => {
		const domain = extractDomain(tab.url);
		if (tabGroups[domain]) {
			tabGroups[domain].push(tab);
		} else {
			tabGroups[domain] = [tab];
		}
	});

	return tabGroups;
}

function changeTitle(title) {
	const titleDiv = document.getElementById("titleDiv");
	titleDiv.innerHTML = "";
	const tabTitleSpan = document.createElement("span");
	tabTitleSpan.classList.add("tab-info-title");
	tabTitleSpan.textContent = title;
	titleDiv.appendChild(tabTitleSpan);
}

function updateStats(windows) {
	const totalWindows = windows.length;
	const totalTabs = windows.reduce(
		(acc, window) => acc + window.tabs.length,
		0
	);

	document.getElementById("totalTabs").textContent = totalTabs;
	document.getElementById("totalWindows").textContent = totalWindows;
}

function showTabInfo(tabTitle) {
	changeTitle(tabTitle);
}

function hideGroupButton() {
	const groupTabsButton = document.getElementById("groupTabsButton");
	groupTabsButton.style.display = "none";
}

function showGroupButton() {
	const groupTabsButton = document.getElementById("groupTabsButton");
	groupTabsButton.style.display = "block";
}

function populateTabsByGroup() {
	const boundaryGrid = document.getElementById("boundaryGrid");
	hideGroupButton();
	boundaryGrid.innerHTML = "";
	changeTitle("Opened Tabs by Group");

	chrome.tabs.query({}, (tabs) => {
		const tabGroups = groupTabsByDomain(tabs);

		for (const domain in tabGroups) {
			if (tabGroups.hasOwnProperty(domain)) {
				const tabGroup = tabGroups[domain];

				const groupDiv = document.createElement("div");
				groupDiv.classList.add("tab-group");

				const groupTitle = document.createElement("div");
				groupTitle.classList.add("group-title");
				groupTitle.textContent = domain;

				groupDiv.appendChild(groupTitle);

				const tabRow = document.createElement("div");
				tabRow.classList.add("tab-row");
				const tabGrid = document.createElement("div");
				tabGrid.classList.add("tab-grid");

				const createButton = document.createElement("button");
				createButton.classList.add("create-button");
				createButton.textContent = "Create Window";

				tabGroup.forEach((tab) => {
					// Create tab items within the group
					const tabItem = document.createElement("div");
					tabItem.classList.add("tab-item");

					// ... (Add tab content, icons, etc.)
					const tabIcon = document.createElement("img");
					tabIcon.src = tab.favIconUrl || "default-icon.png"; // Use a default icon if no favicon is available
					tabIcon.classList.add("tab-icon");
					tabItem.appendChild(tabIcon);

					tabGrid.appendChild(tabItem);
					tabItem.addEventListener("click", function () {
						chrome.tabs.update(
							tab.id,
							{ active: true },
							function (updatedTab) {
								chrome.windows.update(updatedTab.windowId, {
									focused: true,
								});
							}
						);
					});

					tabItem.addEventListener("mouseover", function () {
						const tabTitle = tab.title;
						showTabInfo(tabTitle);
					});

					if (tab.active) {
						tabItem.classList.add("highlighted");
					}
				});

				createButton.addEventListener("click", function () {
					createWindowWithTabs(tabGroup);
				});

				tabRow.appendChild(tabGrid);
				tabRow.appendChild(createButton);
				groupDiv.appendChild(tabRow);
				boundaryGrid.appendChild(groupDiv);
			}
		}
	});
}

function populateTabsByWindow() {
	const boundaryGrid = document.getElementById("boundaryGrid"); // Updated element ID
	boundaryGrid.innerHTML = "";
	showGroupButton();
	changeTitle("Opened Tabs by Window");

	chrome.windows.getAll({ populate: true }, function (windows) {
		updateStats(windows);

		windows.forEach(function (window) {
			const windowDiv = document.createElement("div");
			windowDiv.classList.add("window"); // Updated class name

			const tabGrid = document.createElement("div");
			tabGrid.classList.add("tab-grid");

			const windowTitle = document.createElement("div");
			windowTitle.classList.add("window-title");
			windowTitle.textContent = window.title || "No Title";
			// have to extract the name of the websites from the dom

			// then add it to the window Title
			windowDiv.appendChild(windowTitle);

			window.tabs.forEach(function (tab) {
				const tabItem = document.createElement("div");
				tabItem.classList.add("tab-item");

				const tabIcon = document.createElement("img");
				tabIcon.src = tab.favIconUrl || "default-icon.png"; // Use a default icon if no favicon is available
				tabIcon.classList.add("tab-icon");

				// Create a span for the tab title
				const tabTitle = document.createElement("span");
				// tabTitle.textContent = extractDomain(tab.url);

				tabItem.appendChild(tabIcon);
				tabItem.appendChild(tabTitle);

				// Open the tab when clicked
				tabItem.addEventListener("click", function () {
					chrome.tabs.update(
						tab.id,
						{ active: true },
						function (updatedTab) {
							chrome.windows.update(updatedTab.windowId, {
								focused: true,
							});
						}
					);
				});
				tabItem.addEventListener("mouseover", function () {
					const tabTitle = tab.title;
					const tabDesc = tab.url;
					showTabInfo(tabTitle, tabDesc);
				});

				if (tab.active) {
					tabItem.classList.add("highlighted");
				}

				tabGrid.appendChild(tabItem);
			});

			windowDiv.appendChild(tabGrid);
			boundaryGrid.appendChild(windowDiv); // Updated parent element
		});
	});
}

// Populate the grid when the popup is loaded
document.addEventListener("DOMContentLoaded", populateTabsByWindow);

document.addEventListener("DOMContentLoaded", function () {
	const groupTabsButton = document.getElementById("groupTabsButton");
	groupTabsButton.addEventListener("click", function () {
		populateTabsByGroup();
	});
});

document.addEventListener("DOMContentLoaded", function () {
	const homeButton = document.getElementById("homeButton");
	homeButton.addEventListener("click", function () {
		populateTabsByWindow();
	});
});
