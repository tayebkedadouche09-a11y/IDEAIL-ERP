import { Box, TextField, InputAdornment } from "@mui/material";
import { borderRadius, transitions } from "../theme/designTokens";
import SearchIcon from "@mui/icons-material/Search";

export default function EnterpriseSearchBar({
  value,
  onChange,
  placeholder = "Search...",
  sx,
}) {
  return (
    <TextField
      size="small"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      sx={{
        flexGrow: 1,
        minWidth: 200,
        maxWidth: 300,
        "& .MuiOutlinedInput-root": {
          borderRadius: borderRadius.full,
          transition: transitions.fast,
        },
        ...sx,
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        ),
      }}
    />
  );
}