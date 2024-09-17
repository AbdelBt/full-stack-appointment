import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { DatePickerWithRange } from "./dateDispo";

export default function Company() {
  const [daysState, setDaysState] = useState([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [availableDates, setAvailableDates] = useState([]);
  const [timeSlot, setTimeSlot] = useState([]);
  const [selectedOpeningHour, setSelectedOpeningHour] = useState(null);
  const [selectedClosingHour, setSelectedClosingHour] = useState();
  const [workingHours, setWorkingHours] = useState({});
  const [selectedDay, setSelectedDay] = useState("Monday");

  useEffect(() => {
    const user = sessionStorage.getItem("user");
    if (!user) {
      navigate("/");
    }
    fetchDays();
    fetchAvailableDates();
    getTime();
  }, [navigate]);

  const fetchAvailableDates = async () => {
    try {
      const response = await axios.get(
        "https://appointment-fr.onrender.com/available-dates"
      );
      setAvailableDates(response.data);
    } catch (error) {
      console.error("Error fetching available dates:", error);
    }
  };

  const getTime = async () => {
    try {
      const response = await axios.get(
        "https://appointment-fr.onrender.com/available-dates/working-hours"
      );
      const workingHoursData = response.data;

      const workingHoursMap = {};
      workingHoursData.forEach((item) => {
        workingHoursMap[item.day_of_week] = {
          start_hour: item.start_hour,
          end_hour: item.end_hour,
        };
      });

      setWorkingHours(workingHoursMap);

      const timeList = [];
      for (let i = 10; i <= 18; i++) {
        const hour = i < 10 ? "0" + i : i;
        const time = hour + ":00";
        timeList.push({ time });
      }

      setTimeSlot(timeList);
    } catch (error) {
      console.error("Error fetching working hours:", error);
    }
  };

  const fetchDays = async () => {
    try {
      const response = await axios.get(
        "https://appointment-fr.onrender.com/indisponibilities"
      );
      if (response.data.length > 0) {
        // eslint-disable-next-line no-unused-vars
        const { id, ...days } = response.data[0];

        setDaysState(days);
      }
    } catch (error) {
      console.error("Error fetching days:", error);
    }
  };

  const handleDayChange = async (day) => {
    const updatedState = !daysState[day];
    setDaysState((prevState) => ({
      ...prevState,
      [day]: updatedState,
    }));
    try {
      await axios.post(
        "https://appointment-fr.onrender.com/indisponibilities",
        {
          day: day.charAt(0).toUpperCase() + day.slice(1),
          value: updatedState,
        }
      );
      toast({
        description: `Day ${
          updatedState ? "added to" : "removed from"
        } unavailable days`,
        status: "success",
        className: "bg-[#008000]",
      });
    } catch (error) {
      console.error("Error updating day:", error);
      toast({
        description: `Failed to update day`,
        status: "error",
        className: "bg-[#ff0000]",
      });
    }
  };

  const handleChangeAvailableDates = async () => {
    console.log("Selected date range:", dateRange);

    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);

    toDate.setHours(23, 0, 0, 0); // Set hours to 23, minutes to 0, seconds to 0, milliseconds to 0
    fromDate.setHours(6, 0, 0, 0);

    const fromDateStr = `${dateRange.from.toLocaleDateString("en-EN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })}`;

    const toDateStr = `${dateRange.to.toLocaleDateString("en-EN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })}`;

    if (!dateRange.to) {
      toast({
        description: `Please select an end date`,
        status: "warning",
        className: "bg-red-500",
      });
      return;
    }

    try {
      await axios.post("https://appointment-fr.onrender.com/available-dates", {
        from_date: fromDate.toISOString(), // Convertir en format ISO
        to_date: toDate.toISOString(), // Convertir en format ISO
      });
      toast({
        description: `Dates added successfully from ${fromDateStr} to ${toDateStr}`,
        status: "success",
        className: "bg-[#008000]",
      });
      fetchAvailableDates(); // Rafraîchir la liste des dates disponibles après l'ajout
    } catch (error) {
      console.error("Error adding available dates:", error);
      toast({
        description: `Failed to add dates`,
        status: "error",
        className: "bg-[#ff0000]",
      });
    }
  };

  const handleTimeSlotClick = (time) => {
    if (!selectedOpeningHour) {
      // Sélectionner l'heure d'ouverture
      setSelectedOpeningHour(time);
      setWorkingHours((prev) => ({
        ...prev,
        [selectedDay]: {
          ...prev[selectedDay],
          start_hour: time.split(":")[0],
        },
      }));
    } else if (!selectedClosingHour) {
      // Sélectionner l'heure de fermeture
      if (time >= selectedOpeningHour) {
        setSelectedClosingHour(time);
        setWorkingHours((prev) => ({
          ...prev,
          [selectedDay]: {
            ...prev[selectedDay],
            end_hour: time.split(":")[0],
          },
        }));
      } else {
        toast({
          description: "The closing hour must be after the opening hour.",
          status: "warning",
          className: "bg-red-500",
        });
        setSelectedOpeningHour(null);
        setSelectedClosingHour(null);
      }
    } else {
      // Réinitialiser la sélection
      setSelectedOpeningHour(time);
      setSelectedClosingHour(null);
      setWorkingHours((prev) => ({
        ...prev,
        [selectedDay]: {
          ...prev[selectedDay],
          start_hour: time.split(":")[0],
          end_hour: null,
        },
      }));
    }
  };

  const handleSaveTimes = async () => {
    if (!selectedOpeningHour || !selectedClosingHour) {
      toast({
        description: `Please select both opening and closing hours`,
        status: "warning",
        className: "bg-red-500",
      });
      return;
    }

    try {
      const updatedHours = {
        ...workingHours,
        [selectedDay]: {
          start_hour: selectedOpeningHour.split(":")[0],
          end_hour: selectedClosingHour.split(":")[0],
        },
      };

      await axios.post(
        "https://appointment-fr.onrender.com/available-dates/working-hours",
        {
          day_of_week: selectedDay,
          start_hour: selectedOpeningHour.split(":")[0],
          end_hour: selectedClosingHour.split(":")[0],
        }
      );

      toast({
        description: `Working hours saved successfully for ${selectedDay}.`,
        status: "success",
        className: "bg-[#008000]",
      });

      setWorkingHours(updatedHours);
      setSelectedOpeningHour(null);
      setSelectedClosingHour(null);
    } catch (error) {
      console.error("Error saving working hours:", error);
      toast({
        description: `Failed to save working hours.`,
        status: "error",
        className: "bg-[#ff0000]",
      });
    }
  };

  return (
    <div className="flex flex-col w-full  justify-center items-center px-10 gap-2  xl:gap-20 text-white lg:flex-row">
      <div className="flex flex-col ">
        <h1 className="text-4xl font-bold mb-5">Available Dates</h1>
        <div className="flex flex-col">
          <div className="flex justify-center border border-indigo-500 p-2 rounded shadow-2xl bg-black w-full items-center flex-col">
            <div>
              <CardHeader className="space-y-1">
                <CardTitle>Available Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className=" flex  gap-4">
                  {Object.keys(daysState).map((day, index) => (
                    <div key={index} className="flex items-center">
                      <Checkbox
                        id={day}
                        checked={daysState[day]}
                        onCheckedChange={() => handleDayChange(day)}
                      />
                      <Label htmlFor={day} className="ml-2 capitalize">
                        {day}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
              <Toaster />
            </div>
            <DatePickerWithRange
              onSelect={setDateRange}
              className="w-full mt-8"
            />
          </div>

          <div className="mt-5">
            <Button type="submit" onClick={handleChangeAvailableDates}>
              Submit
            </Button>
          </div>
        </div>
        <div>
          <CardHeader className="space-y-1 mt-5">
            <CardTitle className="text-4xl font-bold mb-5">
              Available Hours (week)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center border border-indigo-500 p-5 rounded shadow-2xl bg-black w-full items-center flex-col">
              <Accordion type="single" collapsible className="w-full">
                {[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ].map((day) => {
                  const hours = workingHours[day] || {
                    start_hour: "00",
                    end_hour: "00",
                  };
                  const startTime = `${hours.start_hour}:00`;
                  const endTime = `${hours.end_hour}:00`;

                  return (
                    <AccordionItem value={day} key={day}>
                      <AccordionTrigger onClick={() => setSelectedDay(day)}>
                        {day}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-3 gap-2 p-5 h-full w-full">
                          {timeSlot.map((item, index) => {
                            const isSelectedOpeningHour =
                              item.time === startTime;
                            const isSelectedClosingHour = item.time === endTime;

                            return (
                              <div
                                onClick={() => handleTimeSlotClick(item.time)}
                                key={index}
                                className={`p-2 cursor-pointer border rounded-lg flex justify-center items-center text-center ${
                                  isSelectedOpeningHour || isSelectedClosingHour
                                    ? "bg-primary text-white"
                                    : ""
                                }`}
                              >
                                {item.time}
                                {isSelectedOpeningHour && (
                                  <span className="ml-2 text-green-300">
                                    Opening
                                  </span>
                                )}
                                {isSelectedClosingHour && (
                                  <span className="ml-2 text-red-300">
                                    Closing
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-5">
                          <Button
                            type="button"
                            onClick={() => {
                              setSelectedDay(day);
                              handleSaveTimes();
                            }}
                          >
                            Save Times for {day}
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          </CardContent>
          <Toaster />
        </div>
      </div>
    </div>
  );
}
