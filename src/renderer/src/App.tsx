import { Route, Router, Routes, hashIntegration } from "@solidjs/router";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { ApiContextProvider } from "./Api";
import { FormPage } from "./components/FormPage";
import { MainPage } from "./components/MainPage";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ApiContextProvider>
        <Router source={hashIntegration()}>
          <Routes>
            <Route path={"/"} component={MainPage} />
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
      </ApiContextProvider>
    </QueryClientProvider>
  );
}
