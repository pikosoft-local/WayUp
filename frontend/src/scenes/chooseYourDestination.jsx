import React from "react";
import Button from '@mui/material/Button';
import ZoomInIcon from '@mui/icons-material/ZoomIn';

function ChooseYourDestination() {
  return (
    <div className="chooseYourDestination">
      <div>
        <h1>Znajdz swoją kopalnie złota </h1>
        <p>
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Voluptatibus
          consequatur quam illo doloremque culpa atque necessitatibus
          perspiciatis, similique fuga laboriosam officiis libero voluptas ipsa
          mollitia error dolorum impedit animi. Facere fugiat dolore nihil ea
          excepturi dolor placeat ipsa fuga, enim, recusandae praesentium ad
          tempore aperiam voluptatibus qui? Sunt, iure aliquid iste deserunt
          libero ipsa quidem facere ea dolorum ullam dolores harum laboriosam
          nobis, maiores minima, voluptas repudiandae error laborum! Totam in,
          excepturi recusandae hic perferendis saepe iusto soluta aliquid
          tenetur aut temporibus eius maxime cupiditate laudantium quos quo
          harum omnis voluptatem? At eligendi nesciunt repudiandae quidem,
          officiis obcaecati sed cum?
        </p>
        <Button variant="contained" id="button" endIcon={<ZoomInIcon />} href="/meetYou">
          Zabierz mnie do kopalni złota
        </Button>
      </div>
    </div>
  );
}

export default ChooseYourDestination;
