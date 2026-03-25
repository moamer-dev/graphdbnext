// @ts-nocheck
import * as __fd_glob_6 from "../content/docs/querying.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/installation.mdx?collection=docs"
import * as __fd_glob_4 from "../content/docs/index.mdx?collection=docs"
import * as __fd_glob_3 from "../content/docs/first-project.mdx?collection=docs"
import * as __fd_glob_2 from "../content/docs/faq.mdx?collection=docs"
import * as __fd_glob_1 from "../content/docs/configuration.mdx?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, }, {"configuration.mdx": __fd_glob_1, "faq.mdx": __fd_glob_2, "first-project.mdx": __fd_glob_3, "index.mdx": __fd_glob_4, "installation.mdx": __fd_glob_5, "querying.mdx": __fd_glob_6, });