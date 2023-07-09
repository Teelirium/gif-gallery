import { Route, Router, Routes, memoryIntegration } from "@solidjs/router";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { FormPage } from "./components/FormPage";
import Main from "./components/Main";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router source={memoryIntegration()}>
        <Routes>
          <Route path={"/"} component={Main} />
          <Route path={"/add"} component={FormPage} />
          <Route
            path={"/edit/:path"}
            component={FormPage}
            data={(d) => {
              const param = decodeURI(d.params["path"]);
              return param;
            }}
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}
