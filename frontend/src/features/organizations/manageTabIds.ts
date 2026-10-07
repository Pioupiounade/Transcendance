// Ids reliant un onglet (`ManageTabs`) à son panneau (rendu par la page) : `aria-controls` / `aria-labelledby`.
export const tabId = (id: string) => `manage-tab-${id}`;
export const panelId = (id: string) => `manage-panel-${id}`;
