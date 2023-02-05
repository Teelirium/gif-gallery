import { useEffect, useMemo, useState } from "react";
import react from "/react.svg";
import vite from "/vite.svg";
import styles from "./Main.module.scss";
import * as fs from "fs";
import { useQuery } from "react-query";
import * as path from "path";
import { clipboard, ipcRenderer, nativeImage } from "electron";
import { ripGif } from "@/utils/tenorRipper";
import { useAtom } from "jotai/react";
import { foldersAtom } from "@/utils/atoms";

async function loadGifs(folders: string[]) {
  if (folders.length === 0) {
    throw new Error("No folders provided");
  }
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

const Main: React.FC = () => {
  const [folders, setFolders] = useAtom(foldersAtom);
  const foldersArr = useMemo(() => Array.from(folders), [folders.size]);

  const foldersQuery = useQuery("folders", () => {
    ipcRenderer.invoke("load-folders").then(setFolders);
  });
  const gifsQuery = useQuery(["gifs", foldersArr], () => loadGifs(foldersArr), {
    enabled: foldersArr.length > 0,
  });

  useEffect(() => {
    ipcRenderer.send("save-folders", Array.from(folders));
    console.log("Saved folders:", folders);
  }, [folders.size]);

  return (
    <div className="bg-indigo-900 text-indigo-100 p-6 w-screen h-fit min-h-screen">
      <button
        onClick={async (ev) => {
          ev.preventDefault();
          const [folder] = (await ipcRenderer.invoke("select-folder"))
            .filePaths;
          console.log("Selected", folder);
          if (!!folder) {
            setFolders(folders.add(folder));
          }
        }}
        className="absolute top-5 right-5 rounded-md border-indigo-200 border-2 p-2 bg-slate-600 active:bg-indigo-700"
      >
        + Add Folder
      </button>
      <h1>View all the gifs here ok</h1>
      <header className="p-4">
        <div className="grid grid-cols-5 mb-3">
          <h2 className="col-span-full">Loaded folders:</h2>
          {foldersArr.map((fold) => (
            <span key={fold} className="text-center">
              {fold}
            </span>
          ))}
        </div>
        <input
          type={"text"}
          placeholder="this search bar doesn't work yet"
          className="w-full p-1.5 rounded-md text-slate-800"
        />
      </header>
      <main className="grid grid-cols-3 gap-12 p-4">
        {foldersArr.length === 0 && "No folders provided :("}
        {gifsQuery.isError && "No images found :("}
        {gifsQuery.isLoading && "Holup, 1 sec..."}
        {gifsQuery.isSuccess &&
          gifsQuery.data.map((filePath) => (
            <div key={filePath}>
              <div
                className="bg-indigo-500 flex h-40 border-indigo-300 border-4 rounded-md justify-center align-middle object-fill"
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
                  className="object-cover w-full h-full active:object-contain"
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
