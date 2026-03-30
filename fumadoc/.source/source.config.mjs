// source.config.ts
import { defineDocs, defineConfig } from "fumadocs-mdx/config";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
var docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true
    }
  },
  meta: {
    schema: metaSchema
  }
});
var source_config_default = defineConfig({});
export {
  source_config_default as default,
  docs
};
