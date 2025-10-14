import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
  Platform,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Input } from '../Input';

interface DatePickerInputProps {
  value: string | undefined;
  onDateChange: (date: Date, formattedDate: string) => void;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  inputRef?: React.RefObject<TextInput>;
  scrollToInput?: (ref: React.RefObject<TextInput>) => void;
  nextInputRef?: React.RefObject<TextInput>;
}

const DatePickerInput: React.FC<DatePickerInputProps> = ({
  value,
  onDateChange,
  placeholder = 'DD/MM/YYYY',
  maximumDate = new Date(),
  minimumDate,
  inputRef,
  scrollToInput,
  nextInputRef,
}) => {
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDateSelect = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toLocaleDateString('pt-BR');
      onDateChange(date, formattedDate);
      if (nextInputRef?.current) {
        nextInputRef.current.focus();
      }
      if (inputRef && scrollToInput) {
        scrollToInput(inputRef);
      }
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <Input
          placeholder={placeholder}
          value={value}
          editable={false}
          pointerEvents="none"
          ref={inputRef}
        />
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          onChange={handleDateSelect}
        />
      )}
    </View>
  );
};

export default DatePickerInput;