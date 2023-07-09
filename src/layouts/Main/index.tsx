import { JSX, ParentProps, splitProps } from "solid-js";

export function MainLayout(
  props: ParentProps<JSX.HTMLAttributes<HTMLDivElement>>
) {
  const [{ children }, rest] = splitProps(props, ["children"]);
  return (
    <div
      class="flex h-screen w-screen flex-col gap-2 bg-slate-800 p-3 text-slate-100"
      {...rest}
    >
      {children}
    </div>
  );
}
