import { Link } from "@solidjs/router";
import { JSX } from "solid-js";

export function MainFooter(props: JSX.HTMLAttributes<HTMLElement>) {
  return (
    <footer
      class="bottom-0 flex flex-none items-center justify-between"
      {...props}
    >
      <Link class="rounded-md border border-teal-300 p-1 px-2" href="/add">
        + Add Link
      </Link>
      <span>Copyright &copy; Teelirium LOLOLOL</span>
    </footer>
  );
}
