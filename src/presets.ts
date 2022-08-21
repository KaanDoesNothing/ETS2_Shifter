export const presets = {
    default: (speed: number) => {
        if(speed > 98) {
            return 14;
        }else if(speed > 78) {
            return 13;
        }else if(speed > 50) {
            return 12;
        }else if(speed > 30) {
            return 10;
        }else if(speed > 20) {
            return 8;
        }else if(speed > 10) {
            return 6;
        }else if(speed > 0) {
            return 4;
        }
    },
    no_trailer: (speed: number) => {
        if(speed > 98) {
            return 14;
        }
        
        if(speed > 78) {
            return 13;
        }

        if(speed > 48) {
            return 12;
        }

        if(speed > 20) {
            return 10;
        }

        if(speed > 0) {
            return 6;
        }
    }
}