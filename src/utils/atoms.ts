import { atom } from "jotai";

export const foldersAtom = atom<Set<string>>(new Set<string>());
