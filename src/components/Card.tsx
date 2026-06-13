"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { DEFAULT_COURSE_IMAGE } from "@/utils/courseDisplay";

type CardProps = {
  title: string;
  description: string;
  image: string;
};

export default function Card({ title, description, image }: CardProps) {
  const safeImage = image?.trim() || DEFAULT_COURSE_IMAGE;
  const [imageSrc, setImageSrc] = useState(safeImage);

  useEffect(() => {
    setImageSrc(image?.trim() || DEFAULT_COURSE_IMAGE);
  }, [image]);

  return (
    <article className="group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-44 w-full overflow-hidden bg-slate-200">
        <Image
          src={imageSrc}
          alt={title}
          fill
          unoptimized
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={() => setImageSrc(DEFAULT_COURSE_IMAGE)}
        />
      </div>
      <div className="space-y-2 p-4">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </article>
  );
}
