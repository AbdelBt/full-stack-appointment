import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

import { DatePickerWithRange } from "./dateDispo";

export default function Company() {
  const [daysState, setDaysState] = useState([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [availableDates, setAvailableDates] = useState([]);
  const [timeSlot, setTimeSlot] = useState([]);
  const [startHour, setStartHour] = useState(null);
  const [endHour, setEndHour] = useState(null);
  const [selectedOpeningHour, setSelectedOpeningHour] = useState(null);
  const [selectedClosingHour, setSelectedClosingHour] = useState();

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
      console.log(response.data);
    } catch (error) {
      console.error("Error fetching available dates:", error);
    }
  };

  const getTime = async () => {
    try {
      // Récupérer les horaires de travail depuis le backend
      const response = await axios.get(
        "https://appointment-fr.onrender.com/available-dates/working-hours"
      );
      const workingHours = response.data;

      // Création d'un tableau pour les créneaux horaires disponibles
      const timeList = [];

      // Définir des heures globales par défaut si aucune information n'est trouvée
      const defaultStartHour = 10;
      const defaultEndHour = 18;

      // Utiliser les horaires récupérés pour définir les heures
      const start =
        workingHours.length > 0
          ? Math.min(...workingHours.map((item) => item.start_hour))
          : defaultStartHour;
      const end =
        workingHours.length > 0
          ? Math.max(...workingHours.map((item) => item.end_hour))
          : defaultEndHour;

      setStartHour(start);
      setEndHour(end);

      for (let i = 10; i <= 18; i++) {
        const hour = i < 10 ? "0" + i : i; // Formater l'heure pour avoir toujours deux chiffres
        const time = hour + ":00";

        timeList.push({ time });
      }

      setTimeSlot(timeList);
    } catch (error) {
      console.error("Erreur lors de la récupération des horaires :", error);
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
        from_date: dateRange.from,
        to_date: dateRange.to,
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
      setSelectedOpeningHour(time);
    } else if (!selectedClosingHour) {
      setSelectedClosingHour(time);
    } else {
      setSelectedOpeningHour(time);
      setSelectedClosingHour(null);
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
      await axios.post(
        "https://appointment-fr.onrender.com/available-dates/working-hours",
        {
          start_hour: selectedOpeningHour.split(":")[0],
          end_hour: selectedClosingHour.split(":")[0],
        }
      );
      toast({
        description: `Working hours saved successfully.`,
        status: "success",
        className: "bg-[#008000]",
      });
      getTime();
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
              Available Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 border rounded-lg p-5 h-full w-full">
              {timeSlot.map((item, index) => {
                const [hour] = item.time.split(":");
                const isStartHour = parseInt(hour, 10) === startHour;
                const isEndHour = parseInt(hour, 10) === endHour;

                return (
                  <div
                    onClick={() => handleTimeSlotClick(item.time)}
                    key={index}
                    className={`p-2 cursor-pointer border rounded-lg flex justify-center items-center text-center
                      ${
                        isStartHour || isEndHour
                          ? "bg-primary text-white"
                          : item.isUnavailable
                          ? "bg-red-300 text-gray-600 cursor-not-allowed"
                          : item.time === selectedOpeningHour ||
                            item.time === selectedClosingHour
                          ? "bg-primary text-white"
                          : ""
                      }`}
                  >
                    {item.time}

                    {item.time === selectedOpeningHour && (
                      <span className="ml-2 text-green-300">Opening</span>
                    )}
                    {item.time === selectedClosingHour && (
                      <span className="ml-2 text-red-300">Closing</span>
                    )}
                    {item.time === selectedOpeningHour ||
                      (isStartHour && (
                        <span className="ml-2 text-green-300">Opening</span>
                      ))}

                    {item.time === selectedClosingHour ||
                      (isEndHour && (
                        <span className="ml-2 text-red-300">Closing</span>
                      ))}
                  </div>
                );
              })}
            </div>
          </CardContent>
          <div className="mt-5">
            <Button type="button" onClick={handleSaveTimes}>
              Save Times
            </Button>
          </div>
          <Toaster />
        </div>
      </div>
    </div>
  );
}
