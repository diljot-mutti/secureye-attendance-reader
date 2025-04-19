import ctypes
from ctypes import wintypes
import datetime
import os
import platform
import csv

# === DLL Path ===
dll_path = r"C:\Program Files (x86)\ONtime\SBXPCDLL.dll"

if not os.path.exists(dll_path):
    print(f"Error: DLL not found at {dll_path}")
    exit()

# Check for SBPCCOMM.dll
sbpccomm_path = r"C:\Program Files (x86)\ONtime\SBPCCOMM.dll"
if not os.path.exists(sbpccomm_path):
    print(f"Warning: SBPCCOMM.dll not found at {sbpccomm_path}. Some functions may not work.")

# === Define BSTR ===
BSTR = ctypes.c_void_p

# === Load DLLs ===
sbxpc = ctypes.WinDLL(dll_path)  # stdcall DLL
oleaut32 = ctypes.OleDLL("oleaut32")

SysAllocString = oleaut32.SysAllocString
SysAllocString.argtypes = [wintypes.LPCWSTR]
SysAllocString.restype = BSTR

SysFreeString = oleaut32.SysFreeString
SysFreeString.argtypes = [BSTR]

# === Function Definitions ===

# _ConnectTcpip
sbxpc._ConnectTcpip.argtypes = [
    ctypes.c_long,      # dwMachineNumber
    ctypes.POINTER(BSTR),  # *BSTR IP
    ctypes.c_long,      # dwPort
    ctypes.c_long       # dwPassword
]
sbxpc._ConnectTcpip.restype = ctypes.c_bool

# _Disconnect
sbxpc._Disconnect.argtypes = []
sbxpc._Disconnect.restype = None

# _GetLastError
sbxpc._GetLastError.argtypes = [ctypes.POINTER(ctypes.c_long)]
sbxpc._GetLastError.restype = None

# _GetSerialNumber
sbxpc._GetSerialNumber.argtypes = [
    ctypes.c_long,
    ctypes.POINTER(BSTR)
]
sbxpc._GetSerialNumber.restype = ctypes.c_bool

# _ReadAllGLogData
sbxpc._ReadAllGLogData.argtypes = [
    ctypes.c_long  # dwMachineNumber
]
sbxpc._ReadAllGLogData.restype = ctypes.c_bool

# _GetGeneralLogData (Corrected based on GetAllGLogData docs)
sbxpc._GetGeneralLogData.argtypes = [
    ctypes.c_long,                  # dwMachineNumber (Input)
    ctypes.POINTER(ctypes.c_long),  # dwTMachineNumber (Output)
    ctypes.POINTER(ctypes.c_long),  # dwEnrollNumber (Output)
    ctypes.POINTER(ctypes.c_long),  # dwEMachineNumber (Output)
    ctypes.POINTER(ctypes.c_long),  # dwVerifyMode (Output)
    ctypes.POINTER(ctypes.c_long),  # dwYear (Output)
    ctypes.POINTER(ctypes.c_long),  # dwMonth (Output)
    ctypes.POINTER(ctypes.c_long),  # dwDay (Output)
    ctypes.POINTER(ctypes.c_long),  # dwHour (Output)
    ctypes.POINTER(ctypes.c_long),  # dwMinute (Output)
    ctypes.POINTER(ctypes.c_long)   # dwSecond (Output)
]
sbxpc._GetGeneralLogData.restype = ctypes.c_bool

# _SetReadMark (to control whether logs are marked as read)
try:
    sbxpc._SetReadMark.argtypes = [ctypes.c_bool]
    sbxpc._SetReadMark.restype = None
    READ_MARK_AVAILABLE = True
except AttributeError:
    print("Warning: _SetReadMark not found in DLL. Cannot control ReadMark property.")
    READ_MARK_AVAILABLE = False

# === Helper Functions ===

def get_last_error():
    """Retrieves the last error code from the DLL."""
    error_code = ctypes.c_long()
    sbxpc._GetLastError(ctypes.byref(error_code))
    return error_code.value

def connect_to_device(ip, port, password, machine_number=1):
    """Connects to the biometric device using TCP/IP."""
    ip_bstr_value = SysAllocString(ip)
    ip_bstr = ctypes.c_void_p(ip_bstr_value)

    try:
        result = sbxpc._ConnectTcpip(machine_number, ctypes.byref(ip_bstr), port, password)
        if result:
            print(f"✅ Connected to device at {ip}:{port}")
            return True
        else:
            print(f"❌ Failed to connect. Error Code: {get_last_error()}")
            return False
    finally:
        SysFreeString(ip_bstr_value)

def disconnect_from_device():
    """Disconnects from the biometric device."""
    sbxpc._Disconnect()
    print("🔌 Disconnected from device.")

def get_serial_number(machine_number=1):
    """Gets the serial number from the device."""
    serial_number_bstr = ctypes.c_void_p()
    result = sbxpc._GetSerialNumber(machine_number, ctypes.byref(serial_number_bstr))

    if result:
        serial_number = ctypes.wstring_at(serial_number_bstr)
        SysFreeString(serial_number_bstr)
        return serial_number
    else:
        print(f"❌ Failed to get serial number. Error Code: {get_last_error()}")
        return None

def read_all_glog_data(machine_number=1, mark_as_read=False):
    """Reads all general logs from the device."""
    if READ_MARK_AVAILABLE:
        sbxpc._SetReadMark(ctypes.c_bool(mark_as_read))
        print(f"📌 ReadMark set to {mark_as_read}")
    else:
        print("⚠️ ReadMark property not available; using default behavior.")

    result = sbxpc._ReadAllGLogData(machine_number)
    if result:
        print("📜 Successfully read all GLogs")
        return True
    else:
        print(f"❌ Failed to read GLogs. Error Code: {get_last_error()}")
        return False

def get_general_log_data(machine_number=1):
    """Retrieves and yields general log data from PC memory."""
    # Variables matching corrected argtypes
    t_machine_number = ctypes.c_long()
    enroll_number = ctypes.c_long()
    e_machine_number = ctypes.c_long()
    verify_mode = ctypes.c_long() # Renamed from status, maps to dwVerifyMode
    year = ctypes.c_long()
    month = ctypes.c_long()
    day = ctypes.c_long()
    hour = ctypes.c_long()
    minute = ctypes.c_long()
    second = ctypes.c_long()
    # Removed backup_number, machine_number_out, status

    while True:
        result = sbxpc._GetGeneralLogData(
            machine_number,
            ctypes.byref(t_machine_number),
            ctypes.byref(enroll_number),
            ctypes.byref(e_machine_number),
            ctypes.byref(verify_mode),
            ctypes.byref(year),
            ctypes.byref(month),
            ctypes.byref(day),
            ctypes.byref(hour),
            ctypes.byref(minute),
            ctypes.byref(second)
            # Pass variables in the corrected order
        )
        if not result:
            break  # No more logs to read

        yield {
            # Yielding values based on corrected variables
            "t_machine_number": t_machine_number.value,
            "enroll_number": enroll_number.value,
            "e_machine_number": e_machine_number.value,
            "verify_mode": verify_mode.value,
            "timestamp": datetime.datetime(
                year.value, month.value, day.value,
                hour.value, minute.value, second.value
            )
            # Removed backup_number, machine_number, status from yield
        }

def main():
    ip_address = "192.168.1.70"
    port = 5005
    password = 123
    machine_number = 1
    csv_filename = "attendance_log.csv"

    print("➡️ Attempting connection...")
    if connect_to_device(ip_address, port, password, machine_number):
        print("🏁 Connection established.")

        # Get and print serial number
        serial_number = get_serial_number(machine_number)
        if serial_number:
            print(f"🔢 Serial Number: {serial_number}")

        # Read all GLogs and write to CSV
        if read_all_glog_data(machine_number, mark_as_read=False):
            print(f"📋 Retrieving GLog entries and writing to {csv_filename}...")
            log_count = 0
            try:
                with open(csv_filename, 'w', newline='') as csvfile:
                    fieldnames = ["User ID", "Timestamp", "Verify Mode"]
                    writer = csv.writer(csvfile)

                    writer.writerow(fieldnames) # Write header

                    for log in get_general_log_data(machine_number):
                        timestamp_str = log['timestamp'].strftime('%Y-%m-%d %H:%M:%S')
                        writer.writerow([
                            log['enroll_number'],
                            timestamp_str,
                            log['verify_mode']
                        ])
                        log_count += 1
                print(f"✅ Successfully wrote {log_count} entries to {csv_filename}")
            except IOError as e:
                print(f"❌ Error writing to CSV file {csv_filename}: {e}")
            except Exception as e:
                 print(f"❌ An unexpected error occurred during CSV writing: {e}")
        else:
            print("💥 Failed to read GLogs.")

        disconnect_from_device()
    else:
        print("💥 Connection failed.")

if __name__ == "__main__":
    main()