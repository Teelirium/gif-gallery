import classNames from "classnames";
import { ipcRenderer } from "electron";
import * as fs from "fs";
import * as path from "path";
import { useMemo } from "react";
import { useQuery, useQueryClient } from "react-query";
import { useNavigate } from "react-router";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";

function readFolder(folder: string) {
  return new Promise<string[]>((resolve, reject) => {
    fs.promises
      .readdir(folder)
      .then((files) => {
        const fullPaths = files.map((file) => path.join(folder, file));
        resolve(fullPaths);
      })
      .catch(reject);
  });
}

async function loadGifs(folders: string[]) {
  const promises = folders.map(readFolder);
  const allFiles = (await Promise.all(promises))
    .flat()
    .filter((file) => file.endsWith(".gif"));
  return allFiles;
}

const tabSchema = z
  .preprocess((s) => parseInt(s as string), z.number().min(0))
  .catch(-1);

export default function Main() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();

  const tab = useMemo(() => {
    const tab = tabSchema.parse(params.get("tab"));
    console.log("Selected tab: ", tab, params.get("tab"));
    return tab;
  }, [params.get("tab")]);

  const { data: folders, ...foldersQuery } = useQuery(
    "folders",
    async () => {
      const folders: string[] = await ipcRenderer.invoke("load-folders");
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
        return loadGifs(folders);
      }
      return loadGifs([folders[tab]]);
    },
    {
      enabled: foldersQuery.isSuccess,
      cacheTime: Infinity,
    }
  );

  return (
    <div className="bg-slate-700 text-slate-100 p-6 w-screen h-fit min-h-screen">
      <button className="absolute bottom-5 right-5 rounded-md border-indigo-200 border p-2 bg-slate-600 active:bg-slate-500">
        + Add Link
      </button>
      <h1>View all the gifs here ok</h1>
      <header className="grid grid-cols-5 gap-3 p-4">
        <button
          className={classNames("text-center rounded-md", "transition-colors", {
            "bg-indigo-500 hover:bg-indigo-400 text-white": tab === -1,
            "bg-slate-600 hover:bg-slate-500": tab !== -1,
          })}
          onClick={() => {
            nav({ pathname: "/" }, { replace: true });
          }}
        >
          All
        </button>
        {folders?.map((fold, i) => (
          <button
            key={fold}
            className={classNames(
              "text-center rounded-md",
              "transition-colors",
              {
                "bg-indigo-500 hover:bg-indigo-400 text-white": tab === i,
                "bg-slate-600 hover:bg-slate-500": tab !== i,
              }
            )}
            title={fold}
            onClick={() => {
              nav({ pathname: "/", search: `?tab=${i}` }, { replace: true });
            }}
          >
            {path.basename(fold)}
          </button>
        ))}
        <button
          className={classNames(
            "text-center rounded-md border border-dashed",
            "hover:bg-slate-100",
            "hover:bg-opacity-25 active:bg-opacity-50",
            "transition-colors"
          )}
          onClick={async (ev) => {
            ev.preventDefault();
            const [folder] = (await ipcRenderer.invoke("select-folder"))
              .filePaths as string[];
            console.log("Selected folder: ", folder);

            if (folder && folders && !folders.includes(folder)) {
              ipcRenderer.send("save-folders", folders.concat(folder));
              queryClient.invalidateQueries("folders");
            }
          }}
        >
          +
        </button>
      </header>
      <input
        type={"text"}
        placeholder="this search bar doesn't work yet"
        className="w-full p-1.5 rounded-md text-slate-800"
      />
      <main className="grid grid-cols-3 gap-6 p-4 h-96 overflow-y-scroll">
        {gifsQuery.isError && "No images found :("}
        {gifsQuery.isLoading && "Holup, 1 sec..."}
        {gifsQuery.isSuccess &&
          gifs?.map((filePath) => (
            <div key={filePath}>
              <div
                className={classNames(
                  "flex h-40",
                  "border-2 hover:border-indigo-300 border-transparent",
                  "transition-colors rounded-md justify-center align-middle"
                )}
                role={"button"}
                title={filePath}
                draggable
                onDragStart={(ev) => {
                  ev.preventDefault();
                  ipcRenderer.send("ondragstart", filePath);
                }}
                onClick={(ev) => {
                  ev.preventDefault();
                  // ripGif(
                  //   "https://tenor.com/view/avatar-see-you-later-thanks-gif-18769401"
                  // ).then(console.log);
                }}
              >
                <img
                  src={"file://" + filePath}
                  className="w-full h-full rounded-md object-cover hover:object-contain"
                />
              </div>
            </div>
          ))}
      </main>
      <footer>Copyright &copy; Teelirium LOLOLOL</footer>
    </div>
  );
}
