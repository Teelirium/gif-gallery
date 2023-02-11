import { foldersAtom } from "@/utils/atoms";
import classNames from "classnames";
import { ipcRenderer } from "electron";
import * as fs from "fs";
import { useAtom } from "jotai/react";
import * as path from "path";
import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "react-query";
import { useLocation, useNavigate } from "react-router";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";

async function loadGifs(folders: string[]) {
  const promises = folders.map(
    (folder) =>
      new Promise<string[]>((resolve, reject) => {
        fs.promises.readdir(folder).then((files) => {
          const fullPaths = files.map((file) => path.join(folder, file));
          resolve(fullPaths);
        });
      })
  );
  const allFiles = (await Promise.all(promises))
    .flat()
    .filter((file) => file.endsWith(".gif"));
  return allFiles;
}

const tabSchema = z
  .preprocess((s) => parseInt(s as string), z.number().min(0))
  .catch(null);

const Main: React.FC = () => {
  const nav = useNavigate();
  const loc = useLocation();
  const [params] = useSearchParams();
  const qClient = useQueryClient();

  const [folders, setFolders] = useAtom(foldersAtom);

  const foldersArr = useMemo(() => Array.from(folders), [folders.size]);
  const tab = useMemo(() => {
    const tab = tabSchema.parse(params.get("tab"));
    console.log("Tab", tab, params.get("tab"));
    return tab;
  }, [params.get("tab")]);

  const foldersQuery = useQuery(["folders", folders.size], async () => {
    return ipcRenderer.invoke("load-folders").then(setFolders);
  });
  const gifsQuery = useQuery(
    ["gifs", foldersArr],
    async () => {
      return loadGifs(foldersArr);
    },
    {
      enabled: foldersArr.length > 0,
    }
  );

  const filteredGifs = useMemo(() => {
    if (tab === null) {
      return gifsQuery.data;
    }
    return gifsQuery.data?.filter((f) => f.includes(foldersArr[tab]));
  }, [tab, gifsQuery.data]);

  useEffect(() => {
    ipcRenderer.send("save-folders", Array.from(folders));
    console.log("Saved folders:", folders);
  }, [folders.size]);

  return (
    <div className="bg-indigo-900 text-indigo-100 p-6 w-screen h-fit min-h-screen">
      <button className="absolute bottom-5 right-5 rounded-md border-indigo-200 border p-2 bg-slate-600 active:bg-slate-500">
        + Add Link
      </button>
      <h1>View all the gifs here ok</h1>
      <header className="grid grid-cols-5 gap-3 p-4">
        <button
          className={classNames("text-center rounded-md", "transition-colors", {
            "bg-indigo-500 hover:bg-indigo-400 text-white": tab === null,
            "bg-slate-600 hover:bg-slate-500": tab !== null,
          })}
          onClick={() => {
            nav({ pathname: "/" }, { replace: true });
          }}
        >
          All
        </button>
        {foldersArr.map((fold, i) => (
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
              .filePaths;
            console.log("Selected", folder);
            if (!!folder) {
              setFolders(folders.add(folder));
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
        {foldersQuery.isError && "No folders provided :("}
        {gifsQuery.isError && "No images found :("}
        {gifsQuery.isLoading && "Holup, 1 sec..."}
        {gifsQuery.isSuccess &&
          filteredGifs?.map((filePath) => (
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
                  className="w-full h-full rounded-md object-cover active:object-contain"
                />
              </div>
            </div>
          ))}
      </main>
      <footer>Copyright &copy; Teelirium LOLOLOL</footer>
    </div>
  );
};

export default Main;
