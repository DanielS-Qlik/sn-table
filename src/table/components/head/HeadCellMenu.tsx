import React, { useRef, useState } from 'react';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grow from '@mui/material/Grow';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import MenuList from '@mui/material/MenuList';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import MoreHoriz from '@mui/icons-material/MoreHoriz';
import { StyledMenuIconButton, StyledCellMenu } from './styles';
import { GeneratedStyling } from '../../types';
import { ExtendedTranslator } from '../../../types';

const MenuItem = ({
  children,
  itemTitle,
  sortOrder,
  sortFromMenu,
}: {
  children: any;
  itemTitle: string;
  sortOrder: string;
  sortFromMenu(evt: React.MouseEvent, sortOrder: string): void;
}) => {
  return (
    <ListItem disablePadding>
      <ListItemButton onClick={(evt) => sortFromMenu(evt, sortOrder)}>
        <ListItemIcon sx={{ minWidth: '25px' }}>{children}</ListItemIcon>
        <ListItemText primary={itemTitle} />
      </ListItemButton>
    </ListItem>
  );
};

export default function HeadCellMenu({
  headerStyle,
  translator,
  sortFromMenu,
}: {
  headerStyle: GeneratedStyling;
  translator: ExtendedTranslator;
  sortFromMenu: (evt: React.MouseEvent, sortOrder: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleClickMenuOpen = () => {
    setOpen(true);
  };

  const handleClickMenuClose = (event: Event | React.SyntheticEvent) => {
    !anchorRef.current?.contains(event.target as HTMLElement) && setOpen(false);
  };

  return (
    <StyledCellMenu headerStyle={headerStyle}>
      <StyledMenuIconButton
        ref={anchorRef}
        tabIndex={-1}
        id="sn-table-head-menu-button"
        aria-controls={open ? 'sn-table-head-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        onClick={handleClickMenuOpen}
      >
        <MoreHoriz />
      </StyledMenuIconButton>
      <Popper
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 9],
            },
          },
        ]}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        placement="bottom-start"
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom-start' ? 'left top' : 'left bottom',
            }}
          >
            <Paper sx={{ boxShadow: 15 }}>
              <ClickAwayListener onClickAway={handleClickMenuClose}>
                <MenuList
                  autoFocusItem={open}
                  className="sn-table-head-menu"
                  aria-labelledby="sn-table-head-menu-button"
                >
                  <MenuItem
                    itemTitle={translator.get('SNTable.MenuItem.SortAscending')}
                    sortOrder="A"
                    sortFromMenu={sortFromMenu}
                  >
                    <ArrowUpwardIcon />
                  </MenuItem>

                  <MenuItem
                    itemTitle={translator.get('SNTable.MenuItem.SortDescending')}
                    sortOrder="D"
                    sortFromMenu={sortFromMenu}
                  >
                    <ArrowDownwardIcon />
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </StyledCellMenu>
  );
}
