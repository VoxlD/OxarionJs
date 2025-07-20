import { readFile } from "fs/promises";

const PKG_NAME = "oxarionjs";

async function check_update() {
  let current_version: string | undefined;
  try {
    const pkg_raw = await readFile("package.json", "utf8");
    const pkg = JSON.parse(pkg_raw);

    if (pkg.name === PKG_NAME && typeof pkg.version === "string")
      current_version = pkg.version;
    else {
      const all_deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };
      if (all_deps[PKG_NAME])
        current_version = all_deps[PKG_NAME].replace(/^[~^>=<]*/, "");
    }
  } catch (error) {
    console.debug(`[Oxarion] Version check error: ${error}`);
    return;
  }

  if (!current_version) {
    console.warn(
      `[Oxarion] Could not determine current version from package.json. Skipping update check.`
    );
    return;
  }

  try {
    const response = await fetch(
      `https://registry.npmjs.org/${PKG_NAME}/latest`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(3000),
      }
    );

    if (!response.ok) {
      console.debug(
        `[Oxarion] Update check failed with status: ${response.status}`
      );
      return;
    }

    const data = await response.json();
    const latest_version = data.version;

    const comparison = Bun.semver.order(current_version, latest_version);
    if (comparison === -1)
      console.warn(
        `[Oxarion] Update available: ${current_version} → ${latest_version}\n` +
          `Run \`bun add ${PKG_NAME}@latest\` to update.\n` +
          `Disable with 'check_latest_update: false' in Oxarion.start options.`
      );
    else if (comparison === 0)
      console.debug(
        `[Oxarion] You are on the latest version (${current_version})`
      );
    else
      console.debug(
        `[Oxarion] Current version (${current_version}) is newer than latest published (${latest_version})`
      );
  } catch (error) {
    console.debug(`[Oxarion] Update check failed: ${error}`);
  }
}

export { check_update };
