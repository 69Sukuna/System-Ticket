"use client";
import Link from "next/link";

export default function EventCard({ event }) {
  // You can change `/event/${event.id}` to the correct route for your event detail page
  return (
    <Link
      href={`/event/${event.id}`}
      className="block cursor-pointer bg-white dark:bg-background-dark shadow-md rounded-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow duration-200"
    >
      <img
        src={event.image}
        alt={event.title}
        className="w-full h-48 object-cover rounded-md mb-4"
      />
      <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
        {event.title}
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        {event.date} - {event.location}
      </p>
      <p className="text-slate-800 dark:text-slate-300">
        {event.description}
      </p>
    </Link>
  );
}