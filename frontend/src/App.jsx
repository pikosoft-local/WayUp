import { useState } from "react";

import "./App.css";

import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import ChooseYourDestination from "./scenes/chooseYourDestination";
import MeetYou from './scenes/meetYou';

function App() {
  return (
    
      <BrowserRouter>
      
        <Routes>
          <Route path="/" element={<ChooseYourDestination />} />
          <Route path="/meetYou" element={<MeetYou />} />
         
        </Routes>
      </BrowserRouter>
    
  );
}

export default App;
