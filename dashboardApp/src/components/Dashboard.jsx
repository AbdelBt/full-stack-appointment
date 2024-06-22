import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DatePickerWithRange } from "./datePickerRange";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axios from "axios";

export default function DataTableDemo() {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [data, setData] = useState([]);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    const user = sessionStorage.getItem("user");
    if (!user) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:3000/reserve"); // Remplacez l'URL par celle de votre backend

        setData(response.data); // Met à jour l'état avec les données récupérées depuis axios
        console.log(response.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
      }
    };

    fetchData(); // Appel de la fonction fetch au chargement du composant
  }, []);

  const filterDataByDateRange = (data, fromDate, toDate) => {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    const toEndDate = new Date(toDate);
    toEndDate.setHours(23, 59, 59, 999);

    return data.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= new Date(fromDate) && itemDate <= new Date(toEndDate);
    });
  };

  const columns = [
    {
      accessorKey: "time_slot",
      header: "Time",
      cell: ({ row }) => (
        <div className="lowercase">{row.getValue("time_slot")}</div>
      ),
      sortingFn: (rowA, rowB, columnId) => {
        const timeA = new Date(rowA.original[columnId]);
        const timeB = new Date(rowB.original[columnId]);
        return timeA - timeB;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status");
        return (
          <div className={`status-cell ${status}`}>
            {status && status.toUpperCase()}
          </div>
        );
      },
    },
    {
      accessorKey: "client_email",
      header: ({ column }) => {
        return (
          <Button
            variant="secondary"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="lowercase">{row.getValue("client_email")}</div>
      ),
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));

        // Format the amount as a dollar amount
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount);

        return <div className="text-right font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: "service",
      header: "Service",
      cell: ({ row }) => {
        const payment = row.original;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [service, setService] = useState(payment.service);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { toast } = useToast();

        const updateService = async (reservationId, newService) => {
          try {
            await axios.post(
              `http://localhost:3000/reserve/${reservationId}/service`,
              { service: newService }
            );

            const updatedData = data.map((item) =>
              item.id === reservationId
                ? { ...item, service: newService }
                : item
            );

            setData(updatedData);

            toast({
              description: "Service updated successfully",
              status: "success",
              className: "bg-[#008000]",
            });
            setService(newService); // Mettre à jour l'état local du service
          } catch (error) {
            console.error("Error updating service:", error);
            toast({
              description: "Not updated, try again !",
              status: "success",
              variant: "destructive",
            });
          }
        };

        return (
          <Select
            value={service}
            onValueChange={(value) => updateService(payment.id, value)}
          >
            <SelectTrigger>
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
        );
      },
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <Button
          variant="secondary"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>{new Date(row.original.date).toLocaleDateString()}</div>
      ),
      sortingFn: (rowA, rowB, columnId) => {
        const dateA = new Date(rowA.original[columnId]);
        const dateB = new Date(rowB.original[columnId]);
        return dateA - dateB;
      },
    },

    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const payment = row.original;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [status, setStatus] = useState(payment.status);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { toast } = useToast();

        // Function to update status via POST request
        const updateStatus = async (reservationId, newStatus) => {
          try {
            await axios.post(
              `http://localhost:3000/reserve/${reservationId}/status`,
              { status: newStatus }
            );
            // Update state or refresh data if needed
            const updatedData = data.map((item) =>
              item.id === reservationId ? { ...item, status: newStatus } : item
            );

            setData(updatedData);
            toast({
              description: "Status updated successfully !",
              status: "success",
              className: "bg-[#008000]",
            });
          } catch (error) {
            console.error("Error updating status:", error);
            toast({
              description: "Not updated, try again !",
              status: "success",
              variant: "destructive",
            });
          }
        };

        const deleteReservation = async (reservationId) => {
          try {
            await axios.delete(
              `http://localhost:3000/reserve/${reservationId}`
            );

            // Remove the deleted reservation from the state
            const updatedData = data.filter(
              (item) => item.id !== reservationId
            );
            setData(updatedData);

            toast({
              description: "Reservation deleted successfully",
              status: "success",
              className: "bg-[#008000]",
            });
          } catch (error) {
            console.error("Error deleting reservation:", error);
            toast({
              description: "Failed to delete reservation",
              status: "error",
              variant: "destructive",
            });
          }
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => deleteReservation(payment.id)}
                className="bg-red-800"
              >
                Delete
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View customer</DropdownMenuItem>
              <DropdownMenuSeparator />
              <Select
                value={status}
                onValueChange={(value) => updateStatus(payment.id, value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Mettre à jour le statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Statut</SelectLabel>
                    <SelectItem value="confirmed">confirmed</SelectItem>
                    <SelectItem value="cancelled">cancelled</SelectItem>
                    <SelectItem value="pending">pending</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  useEffect(() => {
    if (dateRange && dateRange.from && dateRange.to) {
      const filtered = filterDataByDateRange(
        data,
        dateRange.from,
        dateRange.to
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  }, [data, dateRange]);

  return (
    <div className=" text-white mx-5 h-screen" style={{ width: "100%" }}>
      <Toaster />
      <div className="flex items-center py-2">
        <DatePickerWithRange className="mr-5" onSelect={setDateRange} />
        <Input
          placeholder="Filter emails..."
          value={
            columnFilters.find((filter) => filter.id === "client_email")
              ?.value || ""
          }
          onChange={(event) => {
            const value = event.target.value;
            setColumnFilters((prevFilters) => {
              const existingFilter = prevFilters.find(
                (filter) => filter.id === "client_email"
              );
              if (existingFilter) {
                return prevFilters.map((filter) =>
                  filter.id === "client_email" ? { ...filter, value } : filter
                );
              } else {
                return [...prevFilters, { id: "client_email", value }];
              }
            });
          }}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      setColumnVisibility({
                        ...columnVisibility,
                        [column.id]: value,
                      })
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[550px]" />
                      <Skeleton className="h-4 w-[500px]" />
                    </div>
                  </div>{" "}
                  <div className="flex items-center space-x-4 mt-5">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[550px]" />
                      <Skeleton className="h-4 w-[500px]" />
                    </div>
                  </div>{" "}
                  <div className="flex items-center space-x-4 mt-5">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[550px]" />
                      <Skeleton className="h-4 w-[500px]" />
                    </div>
                  </div>{" "}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
