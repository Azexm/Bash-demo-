// Client + server safe: where each role lands after signing in.
export const homeFor = (role) =>
    ({ club_admin: "/club", gate: "/gate", developer: "/dev" })[role] || "/";
