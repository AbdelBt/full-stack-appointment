import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";

export default function Company() {
  const [daysState, setDaysState] = useState([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const user = sessionStorage.getItem("user");
    if (!user) {
      navigate("/");
    }
    fetchDays();
  }, [navigate]);

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

  return (
    <div className="w-full min-h-screen py-5">
      <Card className="ml-2 max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle>Available Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols gap-4">
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
      </Card>
    </div>
  );
}
