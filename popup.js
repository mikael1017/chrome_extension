// popup.js

function extractDomain(url) {
	const domainRegex = /^https?:\/\/(www\.)?([^/]+)/;
	const matches = url.match(domainRegex);
	if (matches && matches.length > 2) {
		return matches[2];
	}
	return url;
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

function updateStats(windows) {
	const totalWindows = windows.length;
	const totalTabs = windows.reduce(
		(acc, window) => acc + window.tabs.length,
		0
	);

	document.getElementById("totalTabs").textContent = totalTabs;
	document.getElementById("totalWindows").textContent = totalWindows;
}

function goHome() {}
function populateTabsByGroup() {
	const boundaryGrid = document.getElementById("boundaryGrid");
	boundaryGrid.innerHTML = "";

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

				const tabGrid = document.createElement("div");
				tabGrid.classList.add("tab-grid");

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
				});

				groupDiv.appendChild(tabGrid);
				boundaryGrid.appendChild(groupDiv);
			}
		}
	});
}

function populateTabsByWindow() {
	const boundaryGrid = document.getElementById("boundaryGrid"); // Updated element ID
	boundaryGrid.innerHTML = "";

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
