export default class FileStamp {

    /**
     * Create a date and time string for file names
     *
     * @return string
     * 
     */
    public dateTime(): string {
        const currentDate = new Date();
        return currentDate.getFullYear() + '-' +
               this.addLeadingZero(currentDate.getMonth() + 1) + '-' +
               this.addLeadingZero(currentDate.getDate()) + '--' +
               this.addLeadingZero(currentDate.getHours()) + '-' +
               this.addLeadingZero(currentDate.getMinutes()) + '-' +
               this.addLeadingZero(currentDate.getSeconds());
    }

    /**
     * Adds a leading zero to single digit date/time values, to assist when sorting file names using these
     * 
     * @param {number} input
     * 
     */
    private addLeadingZero(input: number): string {
        return ('0' + input).slice(-2);
    }

}
