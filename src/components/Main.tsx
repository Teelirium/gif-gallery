import { basename } from "@/utils/basename";
import classNames from "classnames";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { useNavigate } from "react-router";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";

const tabSchema = z
  .preprocess((s) => parseInt(s as string), z.number().min(0))
  .catch(-1);

export default function Main() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const queryClient = useQueryClient();

  const tab = useMemo(() => {
    const tab = tabSchema.parse(params.get("tab"));
    console.log("Selected tab: ", tab, params.get("tab"));
    return tab;
  }, [params.get("tab")]);

  const { data: folders, ...foldersQuery } = useQuery(
    "folders",
    async () => {
      const folders: string[] = await api.loadFolders();
      return folders;
    },
    {
      cacheTime: Infinity,
    }
  );

  const { data: gifs, ...gifsQuery } = useQuery(
    ["gifs", tab],
    async () => {
      if (!folders) {
        throw new Error("Folders not defined");
      }
      if (tab === -1) {
        return api.loadGifs(folders);
      }
      return api.loadGifs([folders[tab]]);
    },
    {
      enabled: foldersQuery.isSuccess,
      cacheTime: Infinity,
    }
  );

  const [search, setSearch] = useState("");
  useEffect(() => {
    console.log(search);
  }, [search]);

  return (
    <div className="flex h-screen w-screen flex-col gap-2 bg-slate-700 p-4 text-slate-100">
      <button
        className="absolute bottom-5 right-5 rounded-md border border-teal-200 p-2 opacity-50"
        disabled
      >
        + Add Link
      </button>
      <header className="grid flex-none grid-cols-5 gap-2 py-2">
        <button
          className={classNames("rounded-md text-center", "transition-colors", {
            "bg-teal-500 text-white hover:bg-teal-400": tab === -1,
            "bg-slate-600 hover:bg-slate-500": tab !== -1,
          })}
          onClick={() => {
            nav({ pathname: "/" }, { replace: true });
          }}
        >
          All
        </button>
        {folders?.map((folder, i) => (
          <button
            key={folder}
            className={classNames(
              "rounded-md text-center",
              "transition-colors",
              {
                "bg-teal-500 text-white hover:bg-teal-400": tab === i,
                "bg-slate-600 hover:bg-slate-500": tab !== i,
              }
            )}
            title={folder}
            onClick={() => {
              nav({ pathname: "/", search: `?tab=${i}` }, { replace: true });
            }}
          >
            {basename(folder)}
          </button>
        ))}
        <button
          className={classNames(
            "rounded-md border border-dashed text-center",
            "hover:bg-slate-100",
            "hover:bg-opacity-25 active:bg-opacity-50",
            "transition-colors"
          )}
          onClick={async (ev) => {
            ev.preventDefault();
            const result = await api.selectFolder();
            const [folder] = result.filePaths;
            console.log("Selected folder: ", folder);

            if (folder && folders && !folders.includes(folder)) {
              // folders.push(folder);
              api.saveFolders(folders.concat(folder));
              queryClient.invalidateQueries("folders");
            }
          }}
        >
          +
        </button>
      </header>
      <input
        type={"text"}
        placeholder="Search..."
        className="w-full rounded-md bg-slate-100 p-1.5 text-slate-800 outline-none outline-2 outline-offset-0 focus:outline-teal-400"
        value={search}
        onChange={(ev) => setSearch(ev.target.value)}
        onContextMenu={() => setSearch("")}
      />
      <main className="grid w-full flex-auto grid-cols-3 gap-6 overflow-x-hidden overflow-y-scroll pr-2">
        {gifsQuery.isError && "No images found :("}
        {gifsQuery.isLoading && "Holup, 1 sec..."}
        {gifsQuery.isSuccess &&
          gifs
            ?.filter((filePath) => filePath.includes(search.trim()))
            .map((filePath) => (
              <div key={filePath}>
                <div
                  className={classNames(
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
                    className="h-full w-full rounded-md object-cover hover:object-contain"
                  />
                  <span className="absolute -bottom-6 max-w-full truncate text-teal-300 opacity-0 transition-opacity group-hover:opacity-100">
                    {basename(filePath)}
                  </span>
                </div>
              </div>
            ))}
      </main>
      <footer className="bottom-0 flex-none">
        Copyright &copy; Teelirium LOLOLOL
      </footer>
    </div>
  );
}
