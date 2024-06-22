import "./App.css";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { loadStripe } from "@stripe/stripe-js";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/toaster";

import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const stripePromise = loadStripe(
  "pk_test_51OtHIvEkbJQNOSQZeyjvF3b9Ib5viQ2s4wctDyQacfgbTaaXszsFxDszo9kVpzdUdg9e5HZHtr0d3hg8I9L7PBJL00k4A1NYF1"
);

const stripe = await stripePromise;

function App() {
  const { toast } = useToast();

  // Récupérer le session_id depuis l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get("session_id");

  const fetchReservationData = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3000/success?session_id=${sessionId}`
      );
      const reservationData = response.data.reservation; // Les données récupérées depuis le backend

      // Formatage de la date pour affichage
      const formattedDate = new Date(reservationData.date);
      const formattedDateString = formattedDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      });

      // Message de toast personnalisé pour le client
      const message = `Your reservation for ${reservationData.service} on ${formattedDateString} at ${reservationData.timeSlot} has been successfully created.`;

      console.log("Reservation Data:", reservationData);
      const postResponse = await axios.post(
        "http://localhost:3000/reserve",
        reservationData
      );

      console.log("Reservation successfully created:", postResponse.data);
      fetchUnavailableDays();

      // Afficher un toast de succès
      toast({
        title: "Payment Successful",
        description: message,
        status: "success",
        className: "bg-[#e4d7cc]",
      });
    } catch (error) {
      console.error("Error fetching reservation data:", error);
      // Gérer les erreurs de récupération des données de réservation
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReservationData();
    }, 500); // ajustez la durée du délai en millisecondes selon vos besoins

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleButtonClick = () => {
      const myAlertDialogTrigger = document.getElementById(
        "myAlertDialogTrigger"
      );
      if (myAlertDialogTrigger) {
        myAlertDialogTrigger.click();
      }
    };

    const button = document.getElementById("myButton");
    if (button) {
      button.addEventListener("click", handleButtonClick);
    }

    return () => {
      if (button) {
        button.removeEventListener("click", handleButtonClick);
      }
    };
  }, []);

  const [date, setDate] = useState(null);
  const [timeSlot, setTimeSlot] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState();
  const [unavailableDays, setUnavailableDays] = useState([]);

  useEffect(() => {
    fetchUnavailableDays();
  }, []);

  useEffect(() => {
    if (date) {
      getTime(date);
    }
  }, [date, unavailableDays]);

  const getTime = () => {
    const timeList = [];
    for (let i = 8; i < 23; i++) {
      const hour = i < 10 ? "0" + i : i; // Format hour to always be two digits
      const time = hour + ":00";
      const isUnavailable = isTimeUnavailableForDate(time, date);
      timeList.push({ time, isUnavailable });
    }
    setTimeSlot(timeList);
  };

  const isTimeUnavailableForDate = (time, date) => {
    if (!date) return false; // Vérifie si date est null, dans ce cas, retourne false
    return unavailableDays.some((unavailable) => {
      const unavailableDate = new Date(unavailable.jour);
      const isSameYear = date.getFullYear() === unavailableDate.getFullYear();
      const isSameMonth = date.getMonth() === unavailableDate.getMonth();
      const isSameDay = date.getDate() === unavailableDate.getDate();
      return (
        isSameYear &&
        isSameMonth &&
        isSameDay &&
        time === unavailable.heure.split(":")[0] + ":00"
      );
    });
  };

  const fetchUnavailableDays = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/indisponibilities"
      );
      setUnavailableDays(response.data);
    } catch (error) {
      console.error("Error fetching unavailable days:", error);
    }
  };

  const isDayUnavailable = useCallback(
    (day) => {
      const unavailableDates = unavailableDays.map(
        (unavailableDay) => new Date(unavailableDay.jour)
      );
      return unavailableDates.some((unavailableDate) => {
        const isSameYear = day.getFullYear() === unavailableDate.getFullYear();
        const isSameMonth = day.getMonth() === unavailableDate.getMonth();
        const isSameDay = day.getDate() === unavailableDate.getDate();
        return isSameYear && isSameMonth && isSameDay;
      });
    },
    [unavailableDays]
  );

  const getNextAvailableDate = useCallback(
    (startDate) => {
      let nextDate = new Date(startDate);
      while (isPastDay(nextDate) || isDayUnavailable(nextDate)) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      return nextDate;
    },
    [isDayUnavailable]
  );

  useEffect(() => {
    if (unavailableDays.length > 0) {
      const initialDate = getNextAvailableDate(new Date());
      setDate(initialDate);
    }
  }, [unavailableDays, getNextAvailableDate]);

  const isPastDay = (day) => {
    return day < new Date();
  };

  const [name, setName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [service, setService] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const formatPhoneNumber = (number) => {
    if (!number.startsWith("+")) {
      return "+" + number;
    }
    return number;
  };

  const handleSubmit = async () => {
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

    try {
      const sessionResponse = await axios.post(
        "http://localhost:3000/create-checkout-session",
        {
          reservationData: {
            service: service,
            date: formattedDate,
            timeSlot: selectedTimeSlot,
            clientName: name,
            clientFirstname: firstName,
            phoneNumber: formattedPhoneNumber,
          },
          amount: 1000, // Montant à payer en cents
          currency: "eur", // Devise
        }
      );

      const result = await stripe.redirectToCheckout({
        sessionId: sessionResponse.data.id,
      });

      if (result.error) {
        console.error("Erreur de redirection vers Checkout:", result.error);
        console.log("testtest");

        // Gérer l'erreur de redirection
      }
    } catch (error) {
      console.error("Error:", error);
      // Gérer les erreurs en cas de problème avec la requête POST
    }
  };

  return (
    <div className="App">
      <Toaster />

      <AlertDialog className="z-100">
        <AlertDialogTrigger id="myAlertDialogTrigger" />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <div className="text-center">Reserve Now!</div>
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 mt-5 gap-6">
                  <div className="flex flex-col gap-3 items-baseline">
                    <div className="flex gap-2 items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="size-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z"
                        />
                      </svg>
                      Select Date
                    </div>
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(selectedDate) => {
                        setDate(selectedDate);
                      }}
                      disabled={(day) => isPastDay(day)}
                      className="rounded-md border"
                    />

                    <Select
                      value={service}
                      onValueChange={(value) => setService(value)}
                    >
                      <Label htmlFor="service">Service</Label>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Services</SelectLabel>
                          <SelectItem value="service1">Service 1</SelectItem>
                          <SelectItem value="service2">Service 2</SelectItem>
                          <SelectItem value="service3">Service 3</SelectItem>
                          <SelectItem value="service4">Service 4</SelectItem>
                          <SelectItem value="service5">Service 5</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="mt-3 md:mt-0">
                    <div className="flex gap-2 items-center mb-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="size-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        />
                      </svg>
                      Select Time Slot
                    </div>
                    <div className="grid grid-cols-3 gap-2 border rounded-lg p-5">
                      {timeSlot?.map((item, index) => (
                        <div
                          onClick={() => {
                            if (!item.isUnavailable)
                              setSelectedTimeSlot(item.time);
                          }}
                          key={index}
                          className={`
      p-2 cursor-pointer border rounded-full text-center
      ${
        item.isUnavailable
          ? "bg-red-300 text-gray-600 cursor-not-allowed hover:"
          : item.time === selectedTimeSlot
          ? "bg-primary text-white"
          : ""
      }
    `}
                        >
                          {item.time}
                        </div>
                      ))}
                    </div>
                    <div className="grid w-full max-w-sm items-center gap-1.5 mt-5 text-left">
                      <Label htmlFor="name">First name</Label>
                      <Input
                        type="firstName"
                        id="firstName"
                        placeholder="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="grid w-full max-w-sm items-center gap-1.5 mt-5 text-left">
                      <Label htmlFor="name">Last name</Label>
                      <Input
                        type="name"
                        id="name"
                        placeholder="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <PhoneInput
                      className="mt-5"
                      inputProps={{
                        name: "phone",
                        required: true,
                        autoFocus: true,
                      }}
                      onChange={(value) => setPhoneNumber(value)}
                    />
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-between">
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              disabled={
                !(
                  date &&
                  selectedTimeSlot &&
                  name &&
                  firstName &&
                  phoneNumber &&
                  service
                )
              }
              onClick={handleSubmit}
            >
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default App;
