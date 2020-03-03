#!/bin/sh

pause(){
  read -p "Press [Enter] key to continue..." fackEnterKey
}

start_cli_dev(){
	sudo npm start
}

start_dev(){
    systemctl start comty_dev
    echo "Starting dev server..."
}
 
stop_dev(){
	systemctl stop comty_dev
    echo "Stoping dev server..."
}


show_menus() {
	clear
	echo "~~~~~~~~~~~~~~~~~~~~~"	
	echo " Development Server  "
	echo "~~~~~~~~~~~~~~~~~~~~~"
	echo "1. Start CLI Server"
	echo "2. Start Server"
    echo "3. Stop Server"
	echo "0. Exit"
}

read_options(){
	local choice
	read -p "Enter choice [ 1 - 3] " choice
	case $choice in
        0) exit 0;;
		1) start_cli_dev ;;
		2) start_dev ;;
        3) stop_dev ;;
		
		*) echo -e "${RED}Error...${STD}" && sleep 2
	esac
}
 
trap '' SIGINT SIGQUIT SIGTSTP
 
while true
do
 
	show_menus
	read_options
done