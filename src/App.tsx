import { Route, Router, Routes, memoryIntegration } from "@solidjs/router";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import Main from "./components/Main";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router source={memoryIntegration()}>
        <Routes>
          <Route path="/" component={Main} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}
