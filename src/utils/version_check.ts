const USED_VER = "1.2.19";

async function check_bun_version() {
  const exec = Bun.spawn(["bun", "-v"]);
  const get_ver = (await exec.stdout.text()).trim();

  if (!get_ver) {
    console.warn("Could not determine current Bun version.");
    return false;
  }

  if (USED_VER !== get_ver) {
    console.warn(
      `[Oxarion] Bun version mismatch: expected ${USED_VER}, got ${get_ver}.\nUse 'bun upgrade' to upgrade to the latest version of Bun.`
    );
    return false;
  }

  return true;
}

export { check_bun_version };
