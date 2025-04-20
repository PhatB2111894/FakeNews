import { createContext, useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
const ClassifyContext = createContext();

export function ClassifyProvider({ children }) {
    const [classifyCount, setClassifyCount] = useState(0);
  
    return (
      <ClassifyContext.Provider value={{ classifyCount, setClassifyCount }}>
        {children}
      </ClassifyContext.Provider>
    );
  }
  export function useClassify() {
    return useContext(ClassifyContext);
  }