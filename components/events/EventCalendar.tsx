'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Calendar from 'react-calendar'
import { EventWithDetails } from '@/lib/events'
import Link from 'next/link'
import { Calendar as CalendarIcon, MapPin, Users } from 'lucide-react'
import 'react-calendar/dist/Calendar.css'

interface EventCalendarProps {
  events: EventWithDetails[]
  selectedRegion: string
  selectedType: string
}

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function EventCalendar({ events, selectedRegion, selectedType }: EventCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Value>(new Date())
  const [eventsInMonth, setEventsInMonth] = useState<EventWithDetails[]>([])

  // Filter events based on region and type - memoize to prevent unnecessary recalculations
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const regionMatch = selectedRegion === '全国' || event.location?.includes(selectedRegion)
      const typeMatch = selectedType === '全て' || event.event_type === selectedType
      return regionMatch && typeMatch
    })
  }, [events, selectedRegion, selectedType])

  // Get events for a specific date (for calendar marking)
  const getEventsForDate = useCallback((date: Date) => {
    return filteredEvents.filter((event) => {
      if (!event.event_date) return false
      const eventDate = new Date(event.event_date)
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      )
    })
  }, [filteredEvents])

  // Get events for a specific month
  const getEventsForMonth = useCallback((date: Date) => {
    return filteredEvents.filter((event) => {
      if (!event.event_date) return false
      const eventDate = new Date(event.event_date)
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth()
      )
    }).sort((a, b) => {
      if (!a.event_date || !b.event_date) return 0
      return new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    })
  }, [filteredEvents])

  // Update events when selected date changes
  useEffect(() => {
    if (selectedDate && selectedDate instanceof Date) {
      setEventsInMonth(getEventsForMonth(selectedDate))
    }
  }, [selectedDate, getEventsForMonth])

  // Custom tile content to show event indicators
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const eventsOnThisDate = getEventsForDate(date)
      if (eventsOnThisDate.length > 0) {
        return (
          <div className="flex justify-center mt-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        )
      }
    }
    return null
  }

  // Custom tile class name for styling
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const eventsOnThisDate = getEventsForDate(date)
      if (eventsOnThisDate.length > 0) {
        return 'has-events'
      }
    }
    return null
  }

  const formatSelectedMonth = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long'
    })
  }

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-black dark:text-white flex items-center gap-2">
          <CalendarIcon size={24} />
          大会カレンダー
        </h3>
        
        <style jsx global>{`
          .react-calendar {
            width: 100%;
            background: transparent;
            border: none;
            font-family: inherit;
            line-height: 1.125em;
          }
          
          .react-calendar__navigation {
            display: flex;
            height: 44px;
            margin-bottom: 1em;
          }
          
          .react-calendar__navigation button {
            min-width: 44px;
            background: none;
            border: none;
            font-size: 16px;
            font-weight: 600;
            color: inherit;
            padding: 0 8px;
            border-radius: 8px;
            transition: background-color 0.2s;
          }
          
          .react-calendar__navigation button:hover,
          .react-calendar__navigation button:focus {
            background-color: #f3f4f6;
          }
          
          .dark .react-calendar__navigation button:hover,
          .dark .react-calendar__navigation button:focus {
            background-color: #374151;
          }
          
          .react-calendar__navigation button:disabled {
            opacity: 0.5;
          }
          
          .react-calendar__month-view__weekdays {
            text-align: center;
            text-transform: uppercase;
            font-weight: bold;
            font-size: 0.75em;
            color: #6b7280;
          }
          
          .react-calendar__month-view__weekdays__weekday {
            padding: 0.5em;
          }
          
          .react-calendar__month-view__days__day {
            padding: 0.75em 0.5em;
            border-radius: 8px;
            margin: 2px;
            transition: all 0.2s;
            min-height: 48px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          
          .react-calendar__month-view__days__day:hover {
            background-color: #f3f4f6;
          }
          
          .dark .react-calendar__month-view__days__day:hover {
            background-color: #374151;
          }
          
          .react-calendar__month-view__days__day--neighboringMonth {
            color: #9ca3af;
          }
          
          .react-calendar__tile--now {
            background: #dbeafe;
            color: #1e40af;
            font-weight: bold;
          }
          
          .dark .react-calendar__tile--now {
            background: #1e3a8a;
            color: #bfdbfe;
          }
          
          .react-calendar__tile--active {
            background: #3b82f6;
            color: white;
            font-weight: bold;
          }
          
          .react-calendar__tile--active:hover {
            background: #2563eb;
          }
          
          .react-calendar__tile.has-events {
            background-color: #f0f9ff;
            font-weight: 600;
          }
          
          .dark .react-calendar__tile.has-events {
            background-color: #0c4a6e;
          }
        `}</style>
        
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          tileContent={tileContent}
          tileClassName={tileClassName}
          locale="ja-JP"
          className="text-black dark:text-white"
        />
      </div>

      {/* Events in selected month */}
      {selectedDate && selectedDate instanceof Date && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-black dark:text-white">
            {formatSelectedMonth(selectedDate)} の大会一覧
          </h3>
          
          {eventsInMonth.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              この月に開催される大会はありません
            </p>
          ) : (
            <div className="space-y-4">
              {eventsInMonth.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="block bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-black dark:text-white mb-2">
                        {event.name}
                      </h4>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <CalendarIcon size={14} />
                          <span>
                            {event.event_date ? new Date(event.event_date).toLocaleDateString('ja-JP') : '日程未定'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin size={14} />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Users size={14} />
                          <span>
                            {event.current_participants || 0}/{event.max_participants || '制限なし'}名
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className="bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full text-sm font-medium">
                        {event.event_type}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}