import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { isDesktopApp } from "@/services/desktop-environment";
import { tauriServerCommands } from "@/services/tauri-server";

function buildDefaultBackupName(): string {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");

  return `investment_portfolio_backup_${stamp}.db`;
}

export function RootMaintenanceView() {
  const desktopMode = useMemo(() => isDesktopApp(), []);
  const [preserveDatabase, setPreserveDatabase] = useState(true);
  const [backupName, setBackupName] = useState(buildDefaultBackupName);
  const [confirmation, setConfirmation] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const canRun = desktopMode && confirmation.trim() === "RESET" && !isRunning;

  const handleReset = async () => {
    if (!canRun) {
      return;
    }

    setIsRunning(true);
    setError(null);
    setStatus("Stopping services and cleaning local state...");

    try {
      const trimmedBackupName = backupName.trim();
      const result = await tauriServerCommands.resetAppDataAndExit(
        preserveDatabase ? trimmedBackupName || undefined : undefined,
      );

      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth-storage");

      if (result.backupPath) {
        setStatus(`Database preserved at ${result.backupPath}. The app will now exit.`);
      } else {
        setStatus("Local app data removed. The app will now exit.");
      }
    } catch (err) {
      setIsRunning(false);
      setError(err instanceof Error ? err.message : "Failed to clean local app data");
      setStatus(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-red-200 bg-red-50/40">
        <CardHeader>
          <CardTitle className="text-red-900">Root Maintenance</CardTitle>
          <CardDescription className="text-red-800">
            This page is restricted to the root account. It removes local runtime state so the next launch behaves like a brand new installation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-red-900">
          <p>
            The reset action stops the bundled backend, removes the active app-data directory, clears local login state, and exits the desktop application.
          </p>
          <p>
            If you preserve the database, it is moved to a separate backup folder outside the live app-data root so the next launch still starts from a clean state.
          </p>
        </CardContent>
      </Card>

      {!desktopMode && (
        <Card>
          <CardHeader>
            <CardTitle>Desktop Only</CardTitle>
            <CardDescription>
              These actions require the Tauri desktop runtime because they operate on native files and terminate the app.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Reset Local Installation</CardTitle>
          <CardDescription>
            Type RESET to enable the destructive action.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            This removes portfolio data, imported transactions, user accounts stored in the local SQLite database, and any other runtime files under the app data folder.
          </div>

          <label className="flex items-start gap-3 rounded-md border border-gray-200 px-4 py-3">
            <input
              type="checkbox"
              checked={preserveDatabase}
              onChange={(event) => setPreserveDatabase(event.target.checked)}
              disabled={isRunning || !desktopMode}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-gray-900">Preserve database by renaming it</span>
              <span className="block text-sm text-gray-600">
                The database is moved into a backup directory so it can be imported later if needed.
              </span>
            </span>
          </label>

          {preserveDatabase && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Backup database file name
              </label>
              <input
                type="text"
                value={backupName}
                onChange={(event) => setBackupName(event.target.value)}
                disabled={isRunning || !desktopMode}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="investment_portfolio_backup_YYYYMMDD.db"
              />
              <p className="mt-1 text-xs text-gray-500">
                Only the file name matters. Invalid characters are normalized automatically.
              </p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Confirmation phrase
            </label>
            <input
              type="text"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={isRunning || !desktopMode}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Type RESET"
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {status && (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              {status}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={!canRun}
            >
              {isRunning ? "Cleaning and exiting..." : "Clean All Local Files And Exit"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}