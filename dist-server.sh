#!/bin/sh

pause(){
  read -p "Press [Enter] key to continue..." fackEnterKey
}

start_cli_dev(){
	sudo serve ./dist
}

start_dev(){
    sudo systemctl start comty_dist
    echo "Starting dev server..."
}
 
stop_dev(){
	sudo systemctl stop comty_dist
    echo "Stoping dev server..."
}
show_logs(){
	sudo journalctl -u comty_dist
	pause
}


show_menus() {
	clear
	echo "~~~~~~~~~~~~~~~~~~~~~"	
	echo " BuildServe Server  "
	echo "~~~~~~~~~~~~~~~~~~~~~"
	echo "1. Start CLI Server"
	echo "2. Start Server"
    echo "3. Stop Server"
	echo "4. Show DevServer Logs"
	echo ""
	echo "0. Exit"
}

read_options(){
	local choice
	read -p "Enter choice [ 1 - 4 ] " choice
	case $choice in
        0) exit 0;;
		1) start_cli_dev ;;
		2) start_dev ;;
        3) stop_dev ;;
		4) show_logs;;
		*) echo -e "${RED}Error...${STD}" && sleep 2
	esac
}
 
trap '' SIGINT SIGQUIT SIGTSTP
 
while true
do
 
	show_menus
	read_options
done