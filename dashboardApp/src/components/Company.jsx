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

  useEffect(() => {
    const user = sessionStorage.getItem("user");
    if (!user) {
      navigate("/");
    }
    fetchDays();
    fetchAvailableDates();
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

  return (
    <div className="flex flex-col w-full h-full justify-center items-center px-10 gap-2  xl:gap-20 text-white lg:flex-row">
      <div className="flex flex-col ">
        <h1 className="text-4xl font-bold mb-5">Available Dates</h1>
        <div className="flex flex-col">
          <div className="flex justify-center border border-indigo-500 p-2 rounded shadow-2xl bg-black w-full items-center flex-col">
            <div>
              {" "}
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
      </div>
    </div>
  );
}
