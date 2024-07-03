import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  CalendarCheck,
  LayoutDashboard,
  Lock,
  LogOut,
  Plus,
  Building2,
  CalendarCog,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { Calendar } from "@/components/ui/calendar";
import { Toaster } from "@/components/ui/toaster";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";

export default function Sidebar({ handleLogout }) {
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState("");
  const [userInitials, setUserInitials] = useState("");
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [service, setService] = useState("");
  const [services, setServices] = useState([]);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [description, setDescription] = useState("");

  const [date, setDate] = useState(null);
  const [timeSlot, setTimeSlot] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState();
  const [unavailableDays, setUnavailableDays] = useState([]);
  const [employeeIds, setEmployeeIds] = useState([]);
  const [employeeDaysOff, setEmployeeDaysOff] = useState([]);
  const [employeeDaysOffWeek, setEmployeeDaysOffWeek] = useState([]);
  const [employeeAvailablePeriods, setEmployeeAvailablePeriods] = useState([]);

  const fetchUnavailableDays = async () => {
    try {
      const response = await axios.get("http://localhost:3000/reserve");
      const { reservations, employeeIds } = response.data;
      const filteredEmployeeIds = employeeIds.filter((id) => id); // Supprime les valeurs null, undefined et vides

      setUnavailableDays(reservations);
      setEmployeeIds(filteredEmployeeIds);
    } catch (error) {
      console.error("Error fetching unavailable days:", error);
    }
  };

  const fetchEmployeeDaysoffWeek = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/employee/days/all"
      );
      const daysOffWeekData = response.data;

      // Filtrer les jours où available est false
      const filteredDaysOffWeek = daysOffWeekData.filter(
        (day) => !day.available
      );

      // Obtenir la liste des employés qui ne sont pas en congé pour la date spécifiée
      const unavailableEmployees = filteredDaysOffWeek.map(
        (dayOffWeek) => dayOffWeek.employee_email
      );

      // Mettre à jour la liste des employés disponibles (employeeIds)
      const availableEmployees = employeeIds.filter(
        (employeeId) => !unavailableEmployees.includes(employeeId)
      );
      setEmployeeIds(availableEmployees);

      // Mettre à jour l'état des jours de congé des employés
      setEmployeeDaysOffWeek(filteredDaysOffWeek);

      return filteredDaysOffWeek;
    } catch (error) {
      console.error("Error fetching employee days off week:", error);
      return [];
    }
  };

  const fetchEmployeeAvailablePeriods = async () => {
    try {
      const response = await axios.get("http://localhost:3000/employee/all");
      const availablePeriodsData = response.data;

      // Mettre à jour l'état des périodes de disponibilité des employés
      setEmployeeAvailablePeriods(availablePeriodsData);

      return availablePeriodsData;
    } catch (error) {
      console.error("Error fetching employee available periods:", error);
      return [];
    }
  };

  useEffect(() => {
    fetchEmployeeDaysoffWeek();
    fetchEmployeeAvailablePeriods();
    fetchEmployeeDaysOff();
  }, []);

  const fetchEmployeeDaysOff = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/employee/days-off/all"
      );
      const daysOffData = response.data.daysOff;

      // Filtrer les jours de congé pour une date spécifique
      const currentDate = new Date(); // Date actuelle
      const filteredDaysOff = daysOffData.filter((dayOff) => {
        const dayOffDate = new Date(dayOff.day_off_date);
        return dayOffDate >= currentDate; // Filtrer pour les jours de congé à partir de la date actuelle
      });

      // Obtenir la liste des employés qui ne sont pas en congé pour la date spécifiée
      const unavailableEmployees = filteredDaysOff.map(
        (dayOff) => dayOff.employee_id
      );

      // Mettre à jour la liste des employés disponibles (employeeIds)
      const availableEmployees = employeeIds.filter(
        (employeeId) => !unavailableEmployees.includes(employeeId)
      );
      setEmployeeIds(availableEmployees);

      setEmployeeDaysOff(filteredDaysOff); // Mettre à jour l'état des jours de congé des employés

      return filteredDaysOff;
    } catch (error) {
      console.error("Error fetching employee days off:", error);
      return [];
    }
  };

  useEffect(() => {
    fetchUnavailableDays();
  }, []);

  const formatPhoneNumber = (number) => {
    if (!number.startsWith("+")) {
      return "+" + number;
    }
    return number;
  };

  // Fonction pour récupérer les services depuis l'API
  const fetchServices = async () => {
    try {
      const response = await axios.get(
        "https://appointment-fr.onrender.com/services"
      );
      setServices(response.data);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const getTime = () => {
    const timeList = [];
    for (let i = 9; i <= 21; i++) {
      const hour = i < 10 ? "0" + i : i; // Format hour to always be two digits
      const time = hour + ":00";
      const isUnavailable = isTimeUnavailableForDate(
        time,
        date,
        employeeIds,
        employeeDaysOff,
        unavailableDays,
        employeeDaysOffWeek,
        employeeAvailablePeriods
      );
      timeList.push({ time, isUnavailable });
    }

    setTimeSlot(timeList);
  };
  useEffect(() => {
    if (date) {
      getTime(date);
      if (isTimeUnavailableForDate(selectedTimeSlot, date, employeeIds)) {
        setSelectedTimeSlot(null);
      }
    }
  }, [date, unavailableDays]);

  const isTimeUnavailableForDate = (time, date, employeeIds) => {
    if (!date) return false; // Si la date n'est pas définie, le créneau est disponible

    if (
      !Array.isArray(employeeDaysOff) ||
      !Array.isArray(employeeDaysOffWeek) ||
      !Array.isArray(employeeAvailablePeriods)
    ) {
      console.error("Employee days off data is not an array");
      return false; // Gérer le cas où les jours de congé des employés ne sont pas disponibles
    }

    // Vérifier si le créneau est indisponible pour chaque employé
    const isAnyEmployeeAvailable = employeeIds.some((employeeId) => {
      // Vérifier si l'employé a un jour de congé hebdomadaire à la date sélectionnée
      const hasWeeklyDayOff = employeeDaysOffWeek.some((dayOffWeek) => {
        const dayOfWeekMapping = {
          sunday: 0,
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6,
        };
        const isOff =
          dayOffWeek.employee_email === employeeId &&
          dayOfWeekMapping[dayOffWeek.day_of_week.toLowerCase()] ===
            date.getDay();

        return isOff;
      });

      if (hasWeeklyDayOff) {
        return false; // L'employé a un jour de congé hebdomadaire, donc le créneau est indisponible
      }

      // Vérifier si l'employé a un jour de congé à la date sélectionnée
      const isDayOff = employeeDaysOff.some((dayOff) => {
        const dayOffDate = new Date(dayOff.day_off_date);
        return (
          dayOff.employee_email === employeeId &&
          dayOffDate.getFullYear() === date.getFullYear() &&
          dayOffDate.getMonth() === date.getMonth() &&
          dayOffDate.getDate() === date.getDate()
        );
      });

      if (isDayOff) {
        return false; // L'employé a un jour de congé, donc le créneau est indisponible
      }

      // Vérifier si l'employé est disponible pendant la période spécifiée
      const isWithinAvailablePeriod = employeeAvailablePeriods.some(
        (period) => {
          const fromDate = new Date(period.from_date);
          const toDate = new Date(period.to_date);
          return (
            period.employee_email === employeeId &&
            date >= fromDate &&
            date <= toDate
          );
        }
      );

      if (!isWithinAvailablePeriod) {
        console.log(
          `Employee ${employeeId} is not available during this period (${date})`
        );
        return false; // L'employé n'est pas disponible pendant cette période, donc le créneau est indisponible
      }

      // Vérifier si le créneau est déjà réservé à la date et à l'heure spécifiées
      const isUnavailable = unavailableDays.some((unavailable) => {
        const unavailableDate = new Date(unavailable.date);
        const isSameYear = date.getFullYear() === unavailableDate.getFullYear();
        const isSameMonth = date.getMonth() === unavailableDate.getMonth();
        const isSameDay = date.getDate() === unavailableDate.getDate();
        const isSameTime = time === unavailable.time_slot.split(":")[0] + ":00";
        const isSameEmployee = unavailable.employe_email === employeeId;

        return (
          isSameYear && isSameMonth && isSameDay && isSameTime && isSameEmployee
        );
      });

      // Si l'employé est indisponible pour ce créneau horaire, retourner false
      return !isUnavailable;
    });

    return !isAnyEmployeeAvailable; // Si aucun employé n'est disponible pour ce créneau, retourner true
  };

  const handleSubmit = async () => {
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

    console.log(
      email,
      service,
      formattedDate,
      selectedTimeSlot,
      name,
      firstName,
      formattedPhoneNumber,
      description
    );
    try {
      await axios.post("http://localhost:3000/reserve/appointment", {
        clientEmail: email,
        service: service,
        date: formattedDate,
        timeSlot: selectedTimeSlot,
        clientName: name,
        clientFirstname: firstName,
        phoneNumber: formattedPhoneNumber,
        description: description,
      });
      const dateObject = new Date(formattedDate);

      // Vérifiez si dateObject est valide
      if (isNaN(dateObject.getTime())) {
        throw new Error("Invalid date");
      }

      const formattedDateString = dateObject.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      });

      const message = `Your reservation for ${service} on ${formattedDateString} at ${selectedTimeSlot} has been successfully created.`;

      fetchUnavailableDays();

      // Réinitialiser les états nécessaires après l'ajout du rendez-vous
      setDate(null);
      setSelectedTimeSlot(null);
      setEmail("");
      setFirstName("");
      setName("");
      setPhoneNumber("");
      setDescription("");
      setService("");

      // Afficher un toast de succès
      toast({
        title: message,
        status: "success",
        className: "bg-[#008000]",
      });
    } catch (error) {
      console.error("Error fetching reservation data:", error);
      // Gérer les erreurs de récupération des données de réservation
      toast({
        variant: "destructive",
        description: "The reservation has not been created, Try again !",
      });
    }
  };

  useEffect(() => {
    // Récupérer les informations de l'utilisateur depuis le sessionStorage
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user && user.email) {
      setUserEmail(user.email);
      setUserInitials(user.email.slice(0, 2).toUpperCase());
    }
  }, []);

  const handleLogoutClick = () => {
    handleLogout(); // Appeler la fonction handleLogout reçue en prop
    navigate("/");
  };

  const menuList = [
    {
      group: "General",
      items: [
        {
          link: "/Dashboard",
          icon: <LayoutDashboard />,
          text: "Appointments",
        },
        {
          link: "/Calender",
          icon: <CalendarCheck />,
          text: "Calender",
        },
        {
          link: "/MyAvailabilities",
          icon: <CalendarCog />,
          text: "My Availabilities",
        },
        {
          link: "/Company",
          icon: <Building2 />,
          text: "Company",
        },

        {
          link: "/Admin",
          icon: <Lock />,
          text: "Admin",
        },
      ],
    },
    {
      group: "Account",
      items: [
        {
          icon: <LogOut />,
          action: handleLogoutClick,
        },
      ],
    },
  ];

  const isPastDay = (day) => {
    return day < new Date();
  };

  return (
    <div className="w-[300px] border-r min-h-screen pt-10 sideb">
      <div>
        <div className="flex items-center justify-center gap-2">
          <div className="avatar rounded-full min-h-12 min-w-12 bg-emerald-500 font-[700] flex items-center justify-center text-white">
            <p>{userInitials}</p>
          </div>
          <div className="text-white">
            <p className="text-md">{userEmail}</p>
          </div>
        </div>
        <Command>
          <CommandList>
            {menuList.map((menu, index) => (
              <CommandGroup key={index} heading={menu.group}>
                {menu.items.map((option, optionsKey) =>
                  option.text ? (
                    <Link to={option.link} key={optionsKey}>
                      <CommandItem
                        key={optionsKey}
                        className="flex gap-2 cursor-pointer"
                      >
                        {option.icon}
                        {option.text}
                      </CommandItem>
                    </Link>
                  ) : (
                    <div onClick={handleLogoutClick} key={index}>
                      <CommandItem
                        key={index}
                        className="flex gap-2 cursor-pointer"
                      >
                        {option.icon}
                        <p>Logout</p>
                      </CommandItem>
                    </div>
                  )
                )}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
        <Sheet className="mt-10">
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="text-white mt-5"
              onClick={() => {
                fetchUnavailableDays();
                fetchServices();
                fetchEmployeeDaysoffWeek();
                fetchEmployeeAvailablePeriods();
                fetchEmployeeDaysOff();
                setDate("");
              }}
            >
              {" "}
              <Plus /> New Appointment
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>New Appointment</SheetTitle>
            </SheetHeader>
            <div>
              <div className=" grid grid-cols-1 md:grid-cols-2 mt-5 gap-6">
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
                  <div className="md:block md:w-auto flex w-full justify-center">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(selectedDate) => {
                        setDate(selectedDate);
                      }}
                      disabled={(day) => isPastDay(day)}
                      className="rounded-md border"
                    />
                  </div>
                </div>
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
                        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                    Select Time Slot
                  </div>
                  <div className="grid grid-cols-3 gap-2 border rounded-lg p-5 h-full w-full">
                    {timeSlot?.map((item, index) => (
                      <div
                        onClick={() => {
                          if (!item.isUnavailable)
                            setSelectedTimeSlot(item.time);
                        }}
                        key={index}
                        className={`

                          p-2 cursor-pointer border rounded-lg flex justify-center items-center text-center

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
                </div>
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5 mt-5 text-left">
                <Label htmlFor="name">Email</Label>
                <Input
                  type="email"
                  id="email"
                  placeholder="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
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
              <div className="grid w-full max-w-sm items-center gap-1.5 mt-5 text-left">
                <Label htmlFor="name">Phone number</Label>

                <PhoneInput
                  inputProps={{
                    name: "phone",
                    required: true,
                    autoFocus: true,
                  }}
                  onChange={(value) => setPhoneNumber(value)}
                />
              </div>

              <div className="grid w-full max-w-sm items-center gap-1.5 mt-5 text-left">
                <Label htmlFor="name">Description</Label>
                <Textarea
                  type="description"
                  placeholder="description"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="mt-5 text-left">
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
                      {services.map((serviceItem) => (
                        <SelectItem
                          key={serviceItem.id}
                          value={serviceItem.name}
                        >
                          {serviceItem.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button
                  disabled={
                    !(
                      date &&
                      description &&
                      selectedTimeSlot &&
                      name &&
                      firstName &&
                      phoneNumber &&
                      service
                    )
                  }
                  onClick={handleSubmit}
                >
                  ADD
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        <Toaster />
      </div>
    </div>
  );
}
Sidebar.propTypes = {
  handleLogout: PropTypes.func.isRequired,
};
