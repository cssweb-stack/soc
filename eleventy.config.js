import { syncShared } from './scripts/sync-shared.mjs';

export default function(eleventyConfig) {
  const sharedRoot = syncShared();
  eleventyConfig.setUseGitIgnore(false);
  eleventyConfig.addWatchTarget(sharedRoot + "/src");
  eleventyConfig.on("eleventy.beforeWatch", () => syncShared());
  eleventyConfig.addFilter("telephone", value => String(value || "").replace(/[^\d+]/g, ""));
  eleventyConfig.addPassthroughCopy({ "src/common.css": "common.css" });
  eleventyConfig.addPassthroughCopy({ "src/shell.css": "shell.css" });
  eleventyConfig.addPassthroughCopy({ "src/soc.css": "geo.css" });
  eleventyConfig.addPassthroughCopy({ "src/_media": "_media" });
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addWatchTarget("src/common.css");
  eleventyConfig.addWatchTarget("src/shell.css");
  eleventyConfig.addWatchTarget("src/soc.css");
  return {
    pathPrefix: process.env.SITE_PATH_PREFIX || "/",
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    htmlTemplateEngine: "njk", markdownTemplateEngine: "njk",
    templateFormats: ["html", "njk", "md"]
  };
}
