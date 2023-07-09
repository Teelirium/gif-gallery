import { MainLayout } from "@/layouts/Main";
import { Gif, gifSchema } from "@/modules/gif/model";
import { createForm, zodForm } from "@modular-forms/solid";
import { Link, useRouteData } from "@solidjs/router";

export function FormPage() {
  const [gifForm, GifForm] = createForm<Gif>({ validate: zodForm(gifSchema) });
  const gifUrl = useRouteData<string | undefined>();

  return (
    <MainLayout>
      <main class="flex w-full flex-col">
        <Link href="/">&lt;= Go Back</Link>
        Editing {gifUrl}
        <GifForm.Form
          class="flex flex-col text-slate-100"
          onSubmit={(d) => {
            console.log(d);
          }}
        >
          <GifForm.Field name="path">
            {(field, props) => (
              <>
                <input
                  placeholder="Path to gif file"
                  type="text"
                  class="border border-slate-400 bg-slate-900"
                  {...props}
                />
                {field.error}
              </>
            )}
          </GifForm.Field>
          <GifForm.Field name="url">
            {(field, props) => (
              <>
                <input
                  placeholder="URL for caching"
                  type="text"
                  class="border border-slate-400 bg-slate-900"
                  {...props}
                />
                {field.error}
              </>
            )}
          </GifForm.Field>
          <button class="text-slate-100" type="submit">
            hit it
          </button>
        </GifForm.Form>
      </main>
    </MainLayout>
  );
}
