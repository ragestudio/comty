export function latestTag(): Promise<string>;
export function latestTagOrFirstCommit(): Promise<string>;
export function commitLogFromRevision(revision: any): Promise<string>;
