import { basename } from "@/utils/basename";
import { useNavigate, useSearchParams } from "@solidjs/router";
import { createQuery, useQueryClient } from "@tanstack/solid-query";
import classNames from "classnames";
import { For, Show, createEffect, createMemo, createSignal } from "solid-js";
import { z } from "zod";

const tabSchema = z
  .preprocess((s) => parseInt(s as string), z.number().min(0))
  .catch(-1);

export default function Main() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();

  const tab = createMemo(() => {
    const param = params.tab;
    const tab = tabSchema.parse(param);
    console.log("Selected tab:", tab, param);
    return tab;
  });

  const foldersQ = createQuery(
    () => ["folders"],
    async () => {
      const folders = await api.loadFolders();
      return folders;
    },
    {
      cacheTime: Infinity,
    }
  );

  const gifsQ = createQuery(
    () => ["gifs", tab()],
    async () => {
      if (!foldersQ.data) {
        throw new Error("Folders not defined");
      }
      if (tab() === -1) {
        return api.loadGifs(foldersQ.data);
      }
      return api.loadGifs([foldersQ.data[tab()]]);
    },
    {
      cacheTime: Infinity,
      // enabled: foldersQ.isSuccess,
    }
  );

  const [search, setSearch] = createSignal("");
  createEffect(() => {
    console.log(search());
  });

  return (
    <div class="flex h-screen w-screen flex-col gap-2 bg-slate-700 p-4 text-slate-100">
      <button
        class="absolute bottom-5 right-5 rounded-md border border-teal-200 p-2 opacity-50"
        disabled
      >
        + Add Link
      </button>
      <header class="grid flex-none grid-cols-5 gap-2 py-2">
        <button
          class={classNames("rounded-md text-center", "transition-colors", {
            "bg-teal-500 text-white hover:bg-teal-400": tab() === -1,
            "bg-slate-600 hover:bg-slate-500": tab() !== -1,
          })}
          onClick={() => {
            setParams({ tab: undefined });
          }}
        >
          All
        </button>
        <For each={foldersQ.data}>
          {(folder, i) => (
            <button
              class={classNames("rounded-md text-center", "transition-colors", {
                "bg-teal-500 text-white hover:bg-teal-400": tab() === i(),
                "bg-slate-600 hover:bg-slate-500": tab() !== i(),
              })}
              title={folder}
              onClick={() => {
                setParams({ tab: i() });
              }}
            >
              {basename(folder)}
            </button>
          )}
        </For>
        <button
          class={classNames(
            "rounded-md border border-dashed text-center",
            "hover:bg-slate-100",
            "hover:bg-opacity-25 active:bg-opacity-50",
            "transition-colors"
          )}
          onClick={async (ev) => {
            ev.preventDefault();
            const result = await api.selectFolder();
            const [folder] = result.filePaths;
            console.log("Selected folder:", folder);

            if (folder && foldersQ.data && !foldersQ.data.includes(folder)) {
              // folders.push(folder);
              api.saveFolders(foldersQ.data.concat(folder));
              queryClient.invalidateQueries(["folders"]);
            }
          }}
        >
          +
        </button>
      </header>
      <input
        type={"text"}
        placeholder="Search..."
        class="w-full rounded-md bg-slate-100 p-1.5 text-slate-800 outline-none outline-2 outline-offset-0 focus:outline-teal-400"
        value={search()}
        onInput={(ev) => setSearch(ev.target.value)}
        onContextMenu={() => setSearch("")}
      />
      <main class="grid w-full flex-auto grid-cols-3 gap-6 overflow-x-hidden overflow-y-scroll pr-2">
        {gifsQ.isError && "No images found :("}
        <Show when={gifsQ.isLoading}>Holup, 1 sec...</Show>
        <For each={gifsQ.data}>
          {(filePath) => (
            <Show when={filePath.includes(search().trim())}>
              <div
                class={classNames(
                  "group relative flex h-40",
                  "border-2 border-transparent hover:border-teal-300",
                  "justify-center rounded-md align-middle transition-colors"
                )}
                role={"button"}
                title={filePath}
                draggable
                onDragStart={(ev) => {
                  ev.preventDefault();
                  api.startDrag(filePath);
                }}
                onClick={(ev) => {
                  ev.preventDefault();
                  // ripGif(
                  //   "https://tenor.com/view/avatar-see-you-later-thanks-gif-18769401"
                  // ).then(console.log);
                }}
              >
                <img
                  src={`file://${filePath}`}
                  loading="lazy"
                  class="h-full w-full rounded-md object-cover hover:object-contain"
                />
                <span class="absolute -bottom-6 max-w-full truncate text-teal-300 opacity-0 transition-opacity group-hover:opacity-100">
                  {basename(filePath)}
                </span>
              </div>
            </Show>
          )}
        </For>
      </main>
      <footer class="bottom-0 flex-none">
        Copyright &copy; Teelirium LOLOLOL
      </footer>
    </div>
  );
}
