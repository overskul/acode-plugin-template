export const config = {
  build: {
    entryFile: "src/main.js",                     // Entry point of the plugin
    outputFile: "dist/main.js",                   // Output JavaScript file & dir
    bundle: "{id}.{author.name}.acodeplugin",     // Plugin bundle filename
    ignoreExtension: [".myext"],                  // File extensions to ignore
    alias: {                                      // Custom path aliases
      "@my_custom_path": "./path/to/custom"
    },
    clean: true,                                  // Clean output before building
    port: 3030,                                   // Development server port
    plugins: ["JSX"],                             // Build plugins to use
    define: {                                     // Global build-time definitions
      test: 10
    }
  },

  plugin: {
    id: "acode.plugin.template",                  // Unique plugin ID
    name: "Acode Plugin Template",                // Plugin display name
    version: "1.0.0",                             // Plugin version
    license: "MIT",                               // Plugin license
    icon: "assets/plugin-icon.png",               // Plugin icon path
    readme: "readme.md",                          // README file path
    changelog: "changelog.md",                    // Changelog file path
    files: ["./assets/", "./LICENSE"],            // Extra files to include in bundle
    keywords: ["Template", "Plugin"],             // Plugin search keywords
    dependencies: [],                             // Required plugin dependencies ids
    price: 0,                                     // Plugin price (0 = free)
    minVersionCode: 965,                          // Minimum required Acode version
    repository: "https://github.com/overskul/acode-plugin-template", // Source repository URL
    author: {
      name: "USER_NAME",                          // Author's name
      email: "EMAIL",                             // Author's email
      url: "URL",                                 // Author's website/profile
      github: "USER_NAME"                         // Author's GitHub username
    },
    contributors: [                               // Plugin Contributors
      {
        name: "CONTRIBUTOR_NAME",
        role: "CONTRIBUTOR_ROLE",
        github: "CONTRIBUTOR_GITHUB"
      },
      ...(await getAllContributors() ?? [])
    ]
  }
}

// get's every contributor in public repo
async function getAllContributors() {
  try {
    const contributors = [];
    const url = config.plugin.repository.split("/");
    const [repo, owner] = [url.pop(), url.pop()];

    for (let page = 1; ; page++) {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100&page=${page}`);
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);

      const data = await response.json();
      if (data.length === 0) break;
      contributors.push(...data);
      if (data.length < 100) break;
    }

    return contributors
      .filter(c => c.login !== owner)
      .map(c => ({ name: c.login, github: c.login, role: "contributor" }));
  } catch (_) {
    return [];
  }
}
