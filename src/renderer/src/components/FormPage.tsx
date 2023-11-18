import { createForm, getValues, setValues, zodForm } from '@modular-forms/solid';
import { Gif, gifSchema } from '@renderer/modules/Gif/model';
import { Link, useRouteData } from '@solidjs/router';
import { createEffect, onMount } from 'solid-js';
import { MainLayout } from './MainLayout';

export function FormPage() {
  const [gifForm, GifForm] = createForm<Gif>({ validate: zodForm(gifSchema) });
  const gifPath = useRouteData<string | undefined>();

  onMount(() => {
    if (gifPath) {
      setValues(gifForm, { path: gifPath });
    }
  });

  createEffect(() => {
    console.log(getValues(gifForm));
  });

  return (
    <MainLayout>
      <main class="flex w-full flex-col">
        <Link href="/">&lt;= Go Back</Link>
        Editing {gifPath}
        <GifForm.Form
          class="flex flex-col text-slate-100"
          onSubmit={(d) => {
            console.log('Submitted', d);
          }}
        >
          <GifForm.Field name="path">
            {(field, props) => (
              <>
                <input
                  {...props}
                  placeholder="Path to gif file"
                  type="text"
                  value={field.value}
                  class="border border-slate-400 bg-slate-900"
                />
                {field.error}
              </>
            )}
          </GifForm.Field>
          <GifForm.Field name="url">
            {(field, props) => (
              <>
                <input
                  {...props}
                  placeholder="URL for caching"
                  type="text"
                  value={field.value}
                  class="border border-slate-400 bg-slate-900"
                />
                {field.error}
              </>
            )}
          </GifForm.Field>
          <button class="text-slate-100" type="submit">
            Save (doesn't work)
          </button>
        </GifForm.Form>
      </main>
    </MainLayout>
  );
}
