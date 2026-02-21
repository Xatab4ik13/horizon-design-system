import { createContext, useContext } from "react";

const ThemeContext = createContext<{ theme: "dark" }>({ theme: "dark" });

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeContext.Provider value={{ theme: "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
};
