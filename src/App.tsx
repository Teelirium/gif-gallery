import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter, Routes, Route } from "react-router";
import Main from "./components/Main";

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Main />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

export default App;
