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

async function loadGifs(folder: string) {
  console.log(path.resolve(folder));
  const dir = await fs.promises.readdir(folder);
  return dir.filter((file) => file.endsWith(".gif"));
}

const Main: React.FC = () => {
  const [folders, setFolders] = useAtom(foldersAtom);
  const foldersArr = useMemo(() => Array.from(folders), [folders.size]);

  const gifsQuery = useQuery(["gifs", foldersArr], () =>
    loadGifs(foldersArr[0])
  );
  const foldersQuery = useQuery("folders", () => {
    ipcRenderer.invoke("load-folders").then(setFolders);
  });

  useEffect(() => {
    ipcRenderer.send("save-folders", Array.from(folders));
    console.log("Saved folders:", folders);
  }, [folders.size]);

  return (
    <div className="bg-indigo-900 text-indigo-100 p-6 w-screen h-fit min-h-screen">
      <h1>View all the gifs here ok</h1>
      <header className="p-4">
        <h2>{foldersArr.join(" ")}</h2>
        <button
          onClick={async (ev) => {
            ev.preventDefault();
            const [folder] = (await ipcRenderer.invoke("select-folder"))
              .filePaths;

            console.log("Selected", folder);
            setFolders((prev) => prev.add(folder));
          }}
          className="absolute top-5 right-5 rounded-md border border-indigo-100 border-3 p-2 bg-slate-700"
        >
          + Add Folder
        </button>
      </header>
      <main className="grid grid-cols-3 gap-12 p-4">
        {gifsQuery.isError && "No images found :("}
        {gifsQuery.isLoading && "1 sec..."}
        {gifsQuery.isSuccess &&
          gifsQuery.data.map((f) => (
            <div
              key={f}
              className="flex h-40 border-indigo-300 border-4 rounded-md justify-center align-middle object-fill"
              draggable
              onDragStart={(ev) => {
                ev.preventDefault();
                ipcRenderer.send("ondragstart", path.join(foldersArr[0], f));
              }}
              onClick={(ev) => {
                ripGif(
                  "https://tenor.com/view/avatar-see-you-later-thanks-gif-18769401"
                ).then(console.log);
              }}
            >
              <img
                src={"file://" + path.join(foldersArr[0], f)}
                className='object-cover w-full h-full'
              />
            </div>
          ))}
      </main>
      <footer>Copyright &copy; Teelirium LOLOLOL</footer>
    </div>
  );
};

export default Main;
